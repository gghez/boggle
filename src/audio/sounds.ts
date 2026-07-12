/**
 * Small Web Audio synth for game feedback: a rising "tick" as each letter joins
 * the traced word, plus win/lose cues when the trace is released. Everything is
 * synthesized on the fly (no audio assets) and degrades to a silent no-op where
 * the Web Audio API is unavailable (e.g. jsdom in tests, very old browsers).
 */

import { isSoundEnabled } from './settings';

/** Semitone offsets of a major pentatonic scale — pleasant however far it climbs. */
const PENTATONIC = [0, 2, 4, 7, 9];

/** A4, the base pitch the tick scale is built on. */
const BASE_FREQ = 440;

/**
 * Pitch (Hz) of the tick for the n-th letter (1-based). Each added letter steps
 * up the pentatonic scale and wraps into the next octave, so the sound gets
 * steadily higher the longer the word in progress grows.
 */
export function tickFrequency(letterCount: number): number {
  const i = Math.max(0, letterCount - 1);
  const octave = Math.floor(i / PENTATONIC.length);
  const semitones = PENTATONIC[i % PENTATONIC.length] + 12 * octave;
  return BASE_FREQ * 2 ** (semitones / 12);
}

export interface SoundPlayer {
  /** Short blip when a letter is added; pitch rises with the word length. */
  tick(letterCount: number): void;
  /** Cheerful ascending arpeggio when a new valid word is accepted. */
  win(): void;
  /** Low descending buzz when the released trace is not a valid word. */
  lose(): void;
  /** Neutral blip when the word is valid but was already found. */
  duplicate(): void;
}

type AudioContextCtor = new () => AudioContext;

function resolveAudioContext(): AudioContextCtor | null {
  const w = globalThis as unknown as {
    AudioContext?: AudioContextCtor;
    webkitAudioContext?: AudioContextCtor;
  };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

/** A single tone with a quick attack/decay envelope, scheduled from `at`. */
interface Tone {
  freq: number;
  /** Start offset in seconds relative to the moment playback begins. */
  at: number;
  duration: number;
  type: OscillatorType;
  gain: number;
}

/**
 * Build a sound player. Lazily creates (and resumes) a single AudioContext on
 * first use — the first sound always follows a pointer gesture, which satisfies
 * browser autoplay policies. Returns a silent stub when Web Audio is missing.
 */
export function createSoundPlayer(): SoundPlayer {
  const resolved = resolveAudioContext();
  if (!resolved) {
    const noop = () => {};
    return { tick: noop, win: noop, lose: noop, duplicate: noop };
  }
  const Ctor = resolved;

  let ctx: AudioContext | null = null;

  function play(tones: Tone[]): void {
    // Respect the persisted mute preference, re-read each time so toggling it
    // takes effect immediately without recreating the player.
    if (!isSoundEnabled()) return;
    try {
      if (!ctx) ctx = new Ctor();
      // A backgrounded/suspended context (mobile) resumes on this user gesture.
      if (ctx.state === 'suspended') void ctx.resume();
      const start = ctx.currentTime;
      for (const t of tones) {
        const osc = ctx.createOscillator();
        const env = ctx.createGain();
        osc.type = t.type;
        osc.frequency.value = t.freq;
        const t0 = start + t.at;
        const t1 = t0 + t.duration;
        // Fast fade in/out avoids clicks on such short tones.
        env.gain.setValueAtTime(0, t0);
        env.gain.linearRampToValueAtTime(t.gain, t0 + 0.008);
        env.gain.exponentialRampToValueAtTime(0.0001, t1);
        osc.connect(env).connect(ctx.destination);
        osc.start(t0);
        osc.stop(t1 + 0.02);
      }
    } catch {
      // Never let an audio glitch interrupt gameplay.
    }
  }

  return {
    tick(letterCount) {
      play([
        { freq: tickFrequency(letterCount), at: 0, duration: 0.07, type: 'triangle', gain: 0.18 },
      ]);
    },
    win() {
      // Ascending C major arpeggio: C5 E5 G5 C6.
      const notes = [523.25, 659.25, 783.99, 1046.5];
      play(
        notes.map((freq, i) => ({
          freq,
          at: i * 0.07,
          duration: 0.14,
          type: 'triangle',
          gain: 0.2,
        })),
      );
    },
    lose() {
      // Two low descending sawtooth notes — a soft "nope".
      play([
        { freq: 220, at: 0, duration: 0.14, type: 'sawtooth', gain: 0.15 },
        { freq: 155.56, at: 0.12, duration: 0.2, type: 'sawtooth', gain: 0.15 },
      ]);
    },
    duplicate() {
      // Single neutral blip: valid word, nothing gained.
      play([{ freq: 392, at: 0, duration: 0.12, type: 'sine', gain: 0.16 }]);
    },
  };
}
