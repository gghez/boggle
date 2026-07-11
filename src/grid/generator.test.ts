import { mulberry32 } from './rng';
import { generateBoard } from './generator';
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
