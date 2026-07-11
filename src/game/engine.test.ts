import { GameEngine } from './engine';
import type { MultiplierMap } from '../grid/generator';

const dict = { has: (w: string) => ['qui', 'oui', 'car'].includes(w) };
// indices: 0=Qu 1=I 2=O 3=U | 4=C 5=A 6=R 7=A | rest A
const board = ['Qu', 'I', 'O', 'U', 'C', 'A', 'R', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A'];
const noBonus: MultiplierMap = new Array<null>(16).fill(null);

test('valid new word scores by letter value and is recorded', () => {
  const g = new GameEngine(board, noBonus, dict);
  expect(g.submitPath([0, 1])).toBe('valid-new'); // "qui" = Qu(9) + I(1)
  expect(g.wordCount).toBe(1);
  expect(g.score).toBe(10);
});

test('bonus tiles raise the score of the path that crosses them', () => {
  const mult: MultiplierMap = new Array<null | 'DL' | 'DW'>(16).fill(null);
  mult[6] = 'DL'; // R doubled
  mult[4] = 'DW'; // whole word doubled
  const g = new GameEngine(board, mult, dict);
  // "car" = C(3) + A(1) + R(1×2=2) = 6; word ×2 = 12.
  expect(g.submitPath([4, 5, 6])).toBe('valid-new');
  expect(g.score).toBe(12);
});

test('duplicate not rescored', () => {
  const g = new GameEngine(board, noBonus, dict);
  g.submitPath([0, 1]);
  expect(g.submitPath([0, 1])).toBe('valid-duplicate');
  expect(g.wordCount).toBe(1);
});

test('too short rejected', () => {
  const g = new GameEngine(board, noBonus, dict);
  expect(g.submitPath([1])).toBe('too-short');
});

test('invalid path rejected', () => {
  const g = new GameEngine(board, noBonus, dict);
  expect(g.submitPath([0, 2])).toBe('invalid-path'); // not adjacent
});

test('not a word rejected', () => {
  const g = new GameEngine(board, noBonus, dict);
  expect(g.submitPath([2, 1, 0])).toBe('not-a-word'); // "oiqu"
});

test('car is a valid word', () => {
  const g = new GameEngine(board, noBonus, dict);
  expect(g.submitPath([4, 5, 6])).toBe('valid-new'); // "car"
});
