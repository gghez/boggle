import {
  areAdjacent,
  isValidPath,
  pathToWord,
  scoreWord,
  humanReach,
  SECONDS_PER_WORD,
} from './rules';

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

test('scoring bareme', () => {
  expect(scoreWord('abc')).toBe(1); // 3
  expect(scoreWord('abcd')).toBe(1); // 4
  expect(scoreWord('abcde')).toBe(2); // 5
  expect(scoreWord('abcdef')).toBe(3); // 6
  expect(scoreWord('abcdefg')).toBe(5); // 7
  expect(scoreWord('abcdefgh')).toBe(11); // 8
  expect(scoreWord('abcdefghij')).toBe(11); // 8+
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
