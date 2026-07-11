import { beforeEach, expect, test, vi } from 'vitest';
import { saveGame } from '../history/store';
import { renderHistory } from './history';
import type { Tile, MultiplierMap } from '../grid/generator';

const board = Array<Tile>(16).fill('A');
const noBonus: MultiplierMap = new Array<null>(16).fill(null);

beforeEach(() => {
  localStorage.clear();
});

test('shows an empty state with no games', () => {
  const root = document.createElement('div');
  renderHistory(root, { onBack: () => {}, onReplay: () => {} });
  expect(root.querySelector('.history-empty')).toBeTruthy();
  expect(root.querySelectorAll('.history-row')).toHaveLength(0);
});

test('lists saved games most recent first', () => {
  saveGame({
    board,
    multipliers: noBonus,
    score: 1,
    wordCount: 1,
    humanMaxScore: 10,
    humanMaxWords: 10,
    scoreToBeat: null,
  });
  saveGame({
    board,
    multipliers: noBonus,
    score: 9,
    wordCount: 4,
    humanMaxScore: 10,
    humanMaxWords: 10,
    scoreToBeat: 8,
  });

  const root = document.createElement('div');
  renderHistory(root, { onBack: () => {}, onReplay: () => {} });
  const rows = root.querySelectorAll('.history-row');
  expect(rows).toHaveLength(2);
  expect(rows[0].textContent).toContain('4/10 mots');
  expect(rows[0].textContent).toContain('Défi : 8 pts à battre');
});

test('the back button invokes onBack', () => {
  const root = document.createElement('div');
  let backed = 0;
  renderHistory(root, { onBack: () => backed++, onReplay: () => {} });
  (root.querySelector('.history-back') as HTMLElement).click();
  expect(backed).toBe(1);
});

test("the replay button invokes onReplay with the game's board, bonuses and target", () => {
  const multipliers: MultiplierMap = new Array<null>(16).fill(null);
  multipliers[0] = 'DW';
  saveGame({
    board,
    multipliers,
    score: 9,
    wordCount: 4,
    humanMaxScore: 10,
    humanMaxWords: 10,
    scoreToBeat: 8,
  });
  const root = document.createElement('div');
  let replayed: unknown = null;
  renderHistory(root, { onBack: () => {}, onReplay: (b, m, s) => (replayed = { b, m, s }) });
  (root.querySelector('.history-row__btn') as HTMLElement).click();
  expect(replayed).toEqual({ b: board, m: multipliers, s: 8 });
});

test('replaying an old record without bonuses falls back to a plain map', () => {
  // Simulate a record persisted before bonus tiles existed (no `multipliers`).
  localStorage.setItem(
    'boggle:history',
    JSON.stringify([
      {
        id: 'x',
        playedAt: new Date().toISOString(),
        board,
        score: 5,
        wordCount: 3,
        humanMaxScore: 10,
        humanMaxWords: 10,
        scoreToBeat: null,
      },
    ]),
  );
  const root = document.createElement('div');
  let replayed: unknown = null;
  renderHistory(root, { onBack: () => {}, onReplay: (b, m, s) => (replayed = { b, m, s }) });
  (root.querySelector('.history-row__btn') as HTMLElement).click();
  expect(replayed).toEqual({ b: board, m: noBonus, s: null });
});

test('the delete button removes the game and re-renders', () => {
  saveGame({
    board,
    multipliers: noBonus,
    score: 1,
    wordCount: 1,
    humanMaxScore: 10,
    humanMaxWords: 10,
    scoreToBeat: null,
  });
  const root = document.createElement('div');
  renderHistory(root, { onBack: () => {}, onReplay: () => {} });
  const [, deleteBtn] = root.querySelectorAll('.history-row__btn');
  (deleteBtn as HTMLElement).click();
  expect(root.querySelectorAll('.history-row')).toHaveLength(0);
  expect(root.querySelector('.history-empty')).toBeTruthy();
});

test('the clear button wipes the history after confirmation', () => {
  saveGame({
    board,
    multipliers: noBonus,
    score: 1,
    wordCount: 1,
    humanMaxScore: 10,
    humanMaxWords: 10,
    scoreToBeat: null,
  });
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  const root = document.createElement('div');
  renderHistory(root, { onBack: () => {}, onReplay: () => {} });
  (root.querySelector('.history-clear') as HTMLElement).click();
  expect(root.querySelectorAll('.history-row')).toHaveLength(0);
  vi.restoreAllMocks();
});

test('the clear button does nothing if the confirmation is declined', () => {
  saveGame({
    board,
    multipliers: noBonus,
    score: 1,
    wordCount: 1,
    humanMaxScore: 10,
    humanMaxWords: 10,
    scoreToBeat: null,
  });
  vi.spyOn(window, 'confirm').mockReturnValue(false);
  const root = document.createElement('div');
  renderHistory(root, { onBack: () => {}, onReplay: () => {} });
  (root.querySelector('.history-clear') as HTMLElement).click();
  expect(root.querySelectorAll('.history-row')).toHaveLength(1);
  vi.restoreAllMocks();
});
