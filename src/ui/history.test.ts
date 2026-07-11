import { beforeEach, expect, test, vi } from 'vitest';
import { saveGame } from '../history/store';
import { renderHistory } from './history';
import type { Tile } from '../grid/generator';

const board = Array<Tile>(16).fill('A');

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
    score: 1,
    wordCount: 1,
    humanMaxScore: 10,
    humanMaxWords: 10,
    wordsToBeat: null,
  });
  saveGame({ board, score: 9, wordCount: 4, humanMaxScore: 10, humanMaxWords: 10, wordsToBeat: 3 });

  const root = document.createElement('div');
  renderHistory(root, { onBack: () => {}, onReplay: () => {} });
  const rows = root.querySelectorAll('.history-row');
  expect(rows).toHaveLength(2);
  expect(rows[0].textContent).toContain('4/10 mots');
  expect(rows[0].textContent).toContain('Défi : 3 à battre');
});

test('the back button invokes onBack', () => {
  const root = document.createElement('div');
  let backed = 0;
  renderHistory(root, { onBack: () => backed++, onReplay: () => {} });
  (root.querySelector('.history-back') as HTMLElement).click();
  expect(backed).toBe(1);
});

test("the replay button invokes onReplay with the game's board and target", () => {
  saveGame({ board, score: 9, wordCount: 4, humanMaxScore: 10, humanMaxWords: 10, wordsToBeat: 3 });
  const root = document.createElement('div');
  let replayed: unknown = null;
  renderHistory(root, { onBack: () => {}, onReplay: (b, w) => (replayed = { b, w }) });
  (root.querySelector('.history-row__btn') as HTMLElement).click();
  expect(replayed).toEqual({ b: board, w: 3 });
});

test('the delete button removes the game and re-renders', () => {
  saveGame({
    board,
    score: 1,
    wordCount: 1,
    humanMaxScore: 10,
    humanMaxWords: 10,
    wordsToBeat: null,
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
    score: 1,
    wordCount: 1,
    humanMaxScore: 10,
    humanMaxWords: 10,
    wordsToBeat: null,
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
    score: 1,
    wordCount: 1,
    humanMaxScore: 10,
    humanMaxWords: 10,
    wordsToBeat: null,
  });
  vi.spyOn(window, 'confirm').mockReturnValue(false);
  const root = document.createElement('div');
  renderHistory(root, { onBack: () => {}, onReplay: () => {} });
  (root.querySelector('.history-clear') as HTMLElement).click();
  expect(root.querySelectorAll('.history-row')).toHaveLength(1);
  vi.restoreAllMocks();
});
