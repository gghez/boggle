import { createSoundPlayer, tickFrequency } from './sounds';

describe('tickFrequency', () => {
  test('rises monotonically with the letter count', () => {
    const freqs = [1, 2, 3, 4, 5, 6, 7, 8].map(tickFrequency);
    for (let i = 1; i < freqs.length; i++) {
      expect(freqs[i]).toBeGreaterThan(freqs[i - 1]);
    }
  });

  test('starts at the base A4 pitch for the first letter', () => {
    expect(tickFrequency(1)).toBeCloseTo(440);
  });

  test('wraps into the next octave after the pentatonic scale', () => {
    // 6th letter wraps to the scale root one octave up (2x the base pitch).
    expect(tickFrequency(6)).toBeCloseTo(880);
  });
});

describe('createSoundPlayer', () => {
  test('is a silent no-op when Web Audio is unavailable (jsdom)', () => {
    // jsdom exposes no AudioContext, so every call must be a harmless no-op.
    const sound = createSoundPlayer();
    expect(() => {
      sound.tick(1);
      sound.tick(5);
      sound.win();
      sound.lose();
      sound.duplicate();
    }).not.toThrow();
  });
});
