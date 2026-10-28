import type { Reverb } from '../rooms';

// A synthetic impulse response: stereo noise under a decay envelope. Left and right get
// independent noise so the tail sounds wide rather than centered.
export function createImpulseResponse(ctx: BaseAudioContext, reverb: Reverb): AudioBuffer {
  const rate = ctx.sampleRate;
  const length = Math.floor(rate * reverb.seconds);
  const preDelay = Math.floor(rate * reverb.preDelay);
  const ir = ctx.createBuffer(2, length, rate);

  for (let channel = 0; channel < 2; channel++) {
    const data = ir.getChannelData(channel);
    for (let i = preDelay; i < length; i++) {
      const t = (i - preDelay) / (length - preDelay);
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, reverb.decay);
    }
  }

  return ir;
}
