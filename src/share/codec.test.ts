import { encodeChallenge, decodeChallenge } from './codec';
import { generateBoard, generateMultipliers, type MultiplierMap } from '../grid/generator';

const noBonus: MultiplierMap = new Array<null>(16).fill(null);

test('encodes a known seed as a tiny "seed.score" token', () => {
  const token = encodeChallenge({
    seed: 123456,
    board: generateBoard(123456),
    multipliers: generateMultipliers(123456),
    scoreToBeat: 42,
  });
  expect(token).toMatch(/^[0-9a-z]+\.[0-9a-z]+$/);
  expect(token.length).toBeLessThan(12);
});

test('decodes a seed token by regenerating the board and bonuses', () => {
  const seed = 2147483647; // largest value randomSeed() can produce
  const token = encodeChallenge({
    seed,
    board: generateBoard(seed),
    multipliers: generateMultipliers(seed),
    scoreToBeat: 128,
  });
  expect(decodeChallenge(token)).toEqual({
    seed,
    board: generateBoard(seed),
    multipliers: generateMultipliers(seed),
    scoreToBeat: 128,
  });
});

test('the seed token is far shorter than the full-board form', () => {
  const seed = 987654;
  const board = generateBoard(seed);
  const multipliers = generateMultipliers(seed);
  const compact = encodeChallenge({ seed, board, multipliers, scoreToBeat: 50 });
  const legacy = encodeChallenge({ board, multipliers, scoreToBeat: 50 });
  expect(compact.length).toBeLessThan(legacy.length / 5);
});

test('round-trips a challenge with its bonus tiles', () => {
  const board = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'Qu'];
  const multipliers: MultiplierMap = new Array<null>(16).fill(null);
  multipliers[2] = 'DL';
  multipliers[5] = 'TW';
  const token = encodeChallenge({ board, multipliers, scoreToBeat: 42 });
  expect(decodeChallenge(token)).toEqual({ board, multipliers, scoreToBeat: 42 });
});

test('token is url-safe', () => {
  const token = encodeChallenge({
    board: Array<string>(16).fill('A'),
    multipliers: noBonus,
    scoreToBeat: 0,
  });
  expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
});

test('returns null on corrupt token', () => {
  expect(decodeChallenge('!!!not-valid!!!')).toBeNull();
  expect(decodeChallenge('')).toBeNull();
});

test('returns null when the multiplier map is malformed', () => {
  const board = Array<string>(16).fill('A');
  // A hand-built v2 payload with an invalid bonus code.
  const bad = ['v2', board, [...new Array<null>(15).fill(null), 'ZZ'], 3];
  const token = btoa(unescape(encodeURIComponent(JSON.stringify(bad))));
  expect(decodeChallenge(token)).toBeNull();
});
