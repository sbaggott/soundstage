export type Room = {
  name: string;
  // Length of the reverb tail in seconds.
  seconds: number;
  // How fast the tail falls away. Higher is a deader room.
  decay: number;
  // Gap before the first reflections arrive. Bigger rooms have longer gaps.
  preDelay: number;
  // Lowpass on the reverb return. Soft surfaces swallow highs, so lower is warmer.
  damping: number;
  // Reverb send level for an instrument at the front of the stage.
  wet: number;
};

export const STUDIO: Room = {
  name: 'Studio',
  seconds: 1.6,
  decay: 3,
  preDelay: 0.012,
  damping: 6500,
  wet: 0.32,
};

// A synthetic impulse response: stereo noise under an exponential-ish decay envelope.
// Left and right get independent noise so the tail sounds wide rather than centered.
export function createImpulseResponse(ctx: BaseAudioContext, room: Room): AudioBuffer {
  const rate = ctx.sampleRate;
  const length = Math.floor(rate * room.seconds);
  const preDelay = Math.floor(rate * room.preDelay);
  const ir = ctx.createBuffer(2, length, rate);

  for (let channel = 0; channel < 2; channel++) {
    const data = ir.getChannelData(channel);
    for (let i = preDelay; i < length; i++) {
      const t = (i - preDelay) / (length - preDelay);
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, room.decay);
    }
  }

  return ir;
}
