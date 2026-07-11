import { encodeChallenge, decodeChallenge } from './codec';
import type { MultiplierMap } from '../grid/generator';

const noBonus: MultiplierMap = new Array<null>(16).fill(null);

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
