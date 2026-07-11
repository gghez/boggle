import {
  areAdjacent,
  isValidPath,
  pathToWord,
  letterValue,
  lengthBonus,
  scorePath,
  humanReach,
  SECONDS_PER_WORD,
} from './rules';
import type { MultiplierMap } from '../grid/generator';

const noBonus: MultiplierMap = new Array<null>(16).fill(null);

test('adjacency on 4x4', () => {
  expect(areAdjacent(0, 1)).toBe(true); // right
  expect(areAdjacent(0, 4)).toBe(true); // down
  expect(areAdjacent(0, 5)).toBe(true); // diagonal
  expect(areAdjacent(0, 2)).toBe(false); // too far
  expect(areAdjacent(3, 4)).toBe(false); // wraps row, not adjacent
});

test('valid path requires distinct adjacent cells', () => {
  expect(isValidPath([0, 1, 2])).toBe(true);
  expect(isValidPath([0, 1, 0])).toBe(false); // reuse
  expect(isValidPath([0, 2])).toBe(false); // not adjacent
});

test('pathToWord expands Qu and normalizes', () => {
  const board = ['Qu', 'I', ...Array<string>(14).fill('A')];
  expect(pathToWord(board, [0, 1])).toBe('qui');
});

test('letterValue uses French Scrabble values, Qu = q + u', () => {
  expect(letterValue('A')).toBe(1);
  expect(letterValue('M')).toBe(2);
  expect(letterValue('C')).toBe(3);
  expect(letterValue('H')).toBe(4);
  expect(letterValue('Q')).toBe(8);
  expect(letterValue('Z')).toBe(10);
  expect(letterValue('Qu')).toBe(9); // 8 + 1
});

test('lengthBonus rewards +5 per letter beyond 4', () => {
  expect(lengthBonus(3)).toBe(0);
  expect(lengthBonus(4)).toBe(0);
  expect(lengthBonus(5)).toBe(5);
  expect(lengthBonus(6)).toBe(10);
  expect(lengthBonus(8)).toBe(20);
});

test('scorePath sums letter values plus the length bonus', () => {
  // board: C A R across cells 0,1,2 → 3 + 1 + 1 = 5, no length bonus (len 3).
  const board = ['C', 'A', 'R', ...Array<string>(13).fill('A')];
  expect(scorePath(board, noBonus, [0, 1, 2])).toBe(5);
});

test('scorePath applies letter then word multipliers, bonus added after', () => {
  const board = ['C', 'A', 'R', 'E', ...Array<string>(12).fill('A')];
  const mult: MultiplierMap = new Array<null | 'TL' | 'DW'>(16).fill(null);
  mult[0] = 'TL'; // C ×3 → 9
  mult[3] = 'DW'; // whole word ×2
  // letters: C(3×3=9) + A(1) + R(1) + E(1) = 12; ×2 word = 24; +5 length bonus (len 4? no).
  // "care" is length 4 → no length bonus, so 24.
  expect(scorePath(board, mult, [0, 1, 2, 3])).toBe(24);
});

test('humanReach caps the ceiling at the highest-scoring enterable words', () => {
  const cap = Math.floor(180 / SECONDS_PER_WORD); // 45 words in 3 minutes
  // More words than a human could enter: only the top `cap` by score count.
  const many = [
    ...Array<number>(cap).fill(11), // the best 45 words: 11 pts each
    ...Array<number>(50).fill(1), // extra words that don't fit the time budget
  ];
  expect(humanReach(many, 180)).toEqual({ words: cap, score: cap * 11 });
});

test('humanReach falls back to the whole board when it holds fewer words', () => {
  // A sparse board: fewer words than the time budget allows, so all of them count.
  expect(humanReach([3, 2, 1], 180)).toEqual({ words: 3, score: 6 });
});

test('humanReach handles an empty board', () => {
  expect(humanReach([], 180)).toEqual({ words: 0, score: 0 });
});
