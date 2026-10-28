import { DEFAULT_ROOM, type Room } from '../rooms';
import { STAGE, type StagePosition, type Stem, type StemId } from '../stems';
import { createImpulseResponse } from './impulse';

// Signal path per stem:
//
//   source → mono → panner (HRTF + distance) ──────────────→ master
//              ├──→ send (more as it moves back) → reverb bus → room ──→ master
//              └──→ analyser (level for the visuals)
//
// The panner gives direction and makes far instruments quieter. The send makes them
// wetter, so the balance of direct sound to room sound changes the way it does in a
// real space. Volume alone sounds like a fader; this sounds like distance.
//
// "room" is a convolver, a lowpass and a return gain. Changing rooms builds a new one and
// crossfades the returns, so the old tail fades out under the new room instead of
// cutting off with a click.

type Channel = {
  stem: Stem;
  buffer: AudioBuffer;
  mono: GainNode;
  panner: PannerNode;
  send: GainNode;
  analyser: AnalyserNode;
  source: AudioBufferSourceNode | null;
  position: StagePosition;
};

type RoomChain = { convolver: ConvolverNode; damping: BiquadFilterNode; out: GainNode };

const SMOOTHING = 0.03;
const ROOM_FADE = 0.35;
const NEAR = STAGE.listenerZ - STAGE.maxZ;
const FAR = Math.hypot(STAGE.maxX, STAGE.listenerZ - STAGE.minZ);

export class AudioEngine {
  readonly ctx: AudioContext;
  readonly duration: number;
  private readonly channels = new Map<StemId, Channel>();
  private readonly master: GainNode;
  private readonly reverbBus: GainNode;
  private roomChain: RoomChain;
  private readonly levelData = new Float32Array(256);
  private room: Room = DEFAULT_ROOM;
  private playing = false;
  // While playing: the context time at which song position 0 would have played.
  private startedAt = 0;
  // While paused: the song position to resume from.
  private pausedAt = 0;
  // Bumped on every start so a stale onended from a stopped source is ignored.
  private generation = 0;
  private endedListeners = new Set<() => void>();

  private constructor(stems: Stem[], buffers: AudioBuffer[], ctx: AudioContext) {
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0.8;
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -6;
    limiter.ratio.value = 12;
    this.master.connect(limiter).connect(ctx.destination);

    this.reverbBus = ctx.createGain();
    this.roomChain = this.buildRoom(this.room);
    this.roomChain.out.gain.value = 1;

    this.placeListener();

    stems.forEach((stem, i) => {
      // Fold the stereo stem to mono so it behaves like one source at one spot.
      const mono = ctx.createGain();
      mono.channelCount = 1;
      mono.channelCountMode = 'explicit';
      mono.channelInterpretation = 'speakers';

      const panner = new PannerNode(ctx, {
        panningModel: 'HRTF',
        distanceModel: 'inverse',
        refDistance: NEAR,
        rolloffFactor: 1,
        maxDistance: 50,
      });
      const send = ctx.createGain();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = this.levelData.length;

      mono.connect(panner).connect(this.master);
      mono.connect(send).connect(this.reverbBus);
      mono.connect(analyser);

      const channel: Channel = {
        stem,
        buffer: buffers[i],
        mono,
        panner,
        send,
        analyser,
        source: null,
        position: stem.home,
      };
      this.channels.set(stem.id, channel);
      this.setPosition(stem.id, stem.home, true);
    });

    this.duration = Math.max(...buffers.map((b) => b.duration));
  }

  static async load(stems: Stem[], onProgress: (loaded: number) => void): Promise<AudioEngine> {
    // Created before any click, so it starts suspended; play() resumes it.
    const ctx = new AudioContext();
    let loaded = 0;
    const buffers = await Promise.all(
      stems.map(async (stem) => {
        const res = await fetch(stem.url);
        if (!res.ok) throw new Error(`Couldn't load ${stem.label} (${res.status})`);
        const buffer = await ctx.decodeAudioData(await res.arrayBuffer());
        onProgress(++loaded);
        return buffer;
      }),
    );
    return new AudioEngine(stems, buffers, ctx);
  }

  get isPlaying() {
    return this.playing;
  }

  get position() {
    if (!this.playing) return this.pausedAt;
    return Math.min(this.duration, Math.max(0, this.ctx.currentTime - this.startedAt));
  }

  async play() {
    if (this.playing) return;
    await this.ctx.resume();
    this.start(this.pausedAt >= this.duration ? 0 : this.pausedAt);
  }

  pause() {
    if (!this.playing) return;
    this.pausedAt = this.position;
    this.stopSources();
    this.playing = false;
  }

  seek(seconds: number) {
    const target = Math.max(0, Math.min(this.duration, seconds));
    if (this.playing) {
      this.stopSources();
      this.start(target);
    } else {
      this.pausedAt = target;
    }
  }

  onEnded(listener: () => void) {
    this.endedListeners.add(listener);
    return () => this.endedListeners.delete(listener);
  }

  get roomId() {
    return this.room.id;
  }

  setRoom(room: Room) {
    if (room.id === this.room.id) return;
    const now = this.ctx.currentTime;
    const previous = this.roomChain;
    const next = this.buildRoom(room);

    previous.out.gain.cancelScheduledValues(now);
    previous.out.gain.setValueAtTime(previous.out.gain.value, now);
    previous.out.gain.linearRampToValueAtTime(0, now + ROOM_FADE);
    next.out.gain.setValueAtTime(0, now);
    next.out.gain.linearRampToValueAtTime(1, now + ROOM_FADE);
    window.setTimeout(() => {
      this.reverbBus.disconnect(previous.convolver);
      previous.out.disconnect();
    }, (ROOM_FADE + 0.1) * 1000);

    this.roomChain = next;
    this.room = room;
    // Each room has its own wetness, so every stem's send has to be recalculated.
    for (const channel of this.channels.values()) this.setPosition(channel.stem.id, channel.position);
  }

  setPosition(id: StemId, position: StagePosition, immediate = false) {
    const channel = this.channels.get(id);
    if (!channel) return;
    channel.position = position;
    const { x, z } = position;
    const { panner, send } = channel;
    const now = this.ctx.currentTime;
    const distance = Math.hypot(x, STAGE.listenerZ - z);
    const depth = Math.min(1, Math.max(0, (distance - NEAR) / (FAR - NEAR)));
    const wet = this.room.reverb.wet * (0.6 + 0.8 * depth);

    if (immediate) {
      panner.positionX.value = x;
      panner.positionY.value = STAGE.earHeight;
      panner.positionZ.value = z;
      send.gain.value = wet;
      return;
    }
    // Glide rather than jump, so a fast drag doesn't click.
    panner.positionX.setTargetAtTime(x, now, SMOOTHING);
    panner.positionZ.setTargetAtTime(z, now, SMOOTHING);
    send.gain.setTargetAtTime(wet, now, SMOOTHING);
  }

  // RMS of the stem before panning, 0 to roughly 1.
  getLevel(id: StemId) {
    const channel = this.channels.get(id);
    if (!channel || !this.playing) return 0;
    channel.analyser.getFloatTimeDomainData(this.levelData);
    let sum = 0;
    for (const sample of this.levelData) sum += sample * sample;
    return Math.sqrt(sum / this.levelData.length);
  }

  dispose() {
    this.stopSources();
    this.endedListeners.clear();
    void this.ctx.close();
  }

  private buildRoom(room: Room): RoomChain {
    const convolver = this.ctx.createConvolver();
    convolver.buffer = createImpulseResponse(this.ctx, room.reverb);
    const damping = this.ctx.createBiquadFilter();
    damping.type = 'lowpass';
    damping.frequency.value = room.reverb.damping;
    const out = this.ctx.createGain();
    out.gain.value = 0;
    this.reverbBus.connect(convolver).connect(damping).connect(out).connect(this.master);
    return { convolver, damping, out };
  }

  private start(offset: number) {
    const when = this.ctx.currentTime + 0.05;
    const generation = ++this.generation;
    let longest: AudioBufferSourceNode | null = null;

    for (const channel of this.channels.values()) {
      if (offset >= channel.buffer.duration) continue;
      const source = this.ctx.createBufferSource();
      source.buffer = channel.buffer;
      source.connect(channel.mono);
      // Every stem starts on the same context time, so they stay locked together.
      source.start(when, offset);
      channel.source = source;
      if (channel.buffer.duration === this.duration) longest = source;
    }

    if (longest) {
      longest.onended = () => {
        if (generation !== this.generation || !this.playing) return;
        this.playing = false;
        this.pausedAt = this.duration;
        this.endedListeners.forEach((listener) => listener());
      };
    }

    this.startedAt = when - offset;
    this.playing = true;
  }

  private stopSources() {
    this.generation++;
    for (const channel of this.channels.values()) {
      channel.source?.stop();
      channel.source?.disconnect();
      channel.source = null;
    }
  }

  private placeListener() {
    const listener = this.ctx.listener;
    if (listener.positionX) {
      listener.positionX.value = 0;
      listener.positionY.value = STAGE.earHeight;
      listener.positionZ.value = STAGE.listenerZ;
      listener.forwardX.value = 0;
      listener.forwardY.value = 0;
      listener.forwardZ.value = -1;
      listener.upX.value = 0;
      listener.upY.value = 1;
      listener.upZ.value = 0;
    } else {
      // Firefox only supports the older setter methods.
      listener.setPosition(0, STAGE.earHeight, STAGE.listenerZ);
      listener.setOrientation(0, 0, -1, 0, 1, 0);
    }
  }
}
