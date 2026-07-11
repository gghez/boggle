import { mulberry32 } from './rng';
import { generateBoard, generateMultipliers } from './generator';
import { FRENCH_DICE } from './dice';

test('rng is deterministic for a seed', () => {
  const a = mulberry32(42);
  const b = mulberry32(42);
  expect(a()).toBeCloseTo(b());
});

test('16 dice each with 6 faces', () => {
  expect(FRENCH_DICE.length).toBe(16);
  for (const d of FRENCH_DICE) expect(d.length).toBe(6);
});

test('generateBoard is deterministic and has 16 valid tiles', () => {
  const b1 = generateBoard(123);
  const b2 = generateBoard(123);
  expect(b1).toEqual(b2);
  expect(b1.length).toBe(16);
  const faces = new Set(FRENCH_DICE.flat());
  for (const t of b1) expect(faces.has(t)).toBe(true);
});

test('different seeds usually differ', () => {
  expect(generateBoard(1)).not.toEqual(generateBoard(2));
});

test('generateMultipliers is deterministic with 4 bonus tiles (2 letter, 2 word)', () => {
  const m1 = generateMultipliers(123);
  const m2 = generateMultipliers(123);
  expect(m1).toEqual(m2);
  expect(m1.length).toBe(16);
  const letters = m1.filter((m) => m === 'DL' || m === 'TL');
  const words = m1.filter((m) => m === 'DW' || m === 'TW');
  expect(letters.length).toBe(2);
  expect(words.length).toBe(2);
  // The remaining cells are plain.
  expect(m1.filter((m) => m === null).length).toBe(12);
});

test('different seeds usually place bonuses differently', () => {
  expect(generateMultipliers(1)).not.toEqual(generateMultipliers(2));
});
