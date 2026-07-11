import { beforeEach, expect, test } from 'vitest';
import { clearHistory, deleteGame, listGames, saveGame } from './store';
import type { Tile, MultiplierMap } from '../grid/generator';

const board = Array<Tile>(16).fill('A');
const noBonus: MultiplierMap = new Array<null>(16).fill(null);

beforeEach(() => {
  localStorage.clear();
});

test('listGames is empty with no history', () => {
  expect(listGames()).toEqual([]);
});

test('saveGame stores a record with an id and timestamp', () => {
  const saved = saveGame({
    board,
    multipliers: noBonus,
    score: 12,
    wordCount: 5,
    humanMaxScore: 30,
    humanMaxWords: 10,
    scoreToBeat: null,
  });
  expect(saved.id).toBeTruthy();
  expect(saved.playedAt).toBeTruthy();

  const games = listGames();
  expect(games).toHaveLength(1);
  expect(games[0]).toEqual(saved);
});

test('listGames returns most recent first', () => {
  const first = saveGame({
    board,
    multipliers: noBonus,
    score: 1,
    wordCount: 1,
    humanMaxScore: 10,
    humanMaxWords: 10,
    scoreToBeat: null,
  });
  const second = saveGame({
    board,
    multipliers: noBonus,
    score: 2,
    wordCount: 2,
    humanMaxScore: 10,
    humanMaxWords: 10,
    scoreToBeat: null,
  });
  expect(listGames().map((g) => g.id)).toEqual([second.id, first.id]);
});

test('deleteGame removes a single record', () => {
  const a = saveGame({
    board,
    multipliers: noBonus,
    score: 1,
    wordCount: 1,
    humanMaxScore: 10,
    humanMaxWords: 10,
    scoreToBeat: null,
  });
  const b = saveGame({
    board,
    multipliers: noBonus,
    score: 2,
    wordCount: 2,
    humanMaxScore: 10,
    humanMaxWords: 10,
    scoreToBeat: null,
  });
  deleteGame(a.id);
  expect(listGames().map((g) => g.id)).toEqual([b.id]);
});

test('clearHistory wipes everything', () => {
  saveGame({
    board,
    multipliers: noBonus,
    score: 1,
    wordCount: 1,
    humanMaxScore: 10,
    humanMaxWords: 10,
    scoreToBeat: null,
  });
  clearHistory();
  expect(listGames()).toEqual([]);
});

test('saveGame caps history at 200 entries, dropping the oldest', () => {
  for (let i = 0; i < 201; i++) {
    saveGame({
      board,
      multipliers: noBonus,
      score: i,
      wordCount: i,
      humanMaxScore: 10,
      humanMaxWords: 10,
      scoreToBeat: null,
    });
  }
  const games = listGames();
  expect(games).toHaveLength(200);
  // The oldest save (score 0) was evicted; the newest (score 200) remains.
  expect(games.some((g) => g.score === 0)).toBe(false);
  expect(games[0].score).toBe(200);
});

test('listGames tolerates corrupt storage', () => {
  localStorage.setItem('boggle:history', '{not json');
  expect(listGames()).toEqual([]);
});
