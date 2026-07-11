import { beforeEach, expect, test } from "vitest";
import { clearHistory, deleteGame, listGames, saveGame } from "./store";

const board = Array(16).fill("A");

beforeEach(() => {
  localStorage.clear();
});

test("listGames is empty with no history", () => {
  expect(listGames()).toEqual([]);
});

test("saveGame stores a record with an id and timestamp", () => {
  const saved = saveGame({
    board,
    score: 12,
    wordCount: 5,
    humanMaxScore: 30,
    humanMaxWords: 10,
    wordsToBeat: null,
  });
  expect(saved.id).toBeTruthy();
  expect(saved.playedAt).toBeTruthy();

  const games = listGames();
  expect(games).toHaveLength(1);
  expect(games[0]).toEqual(saved);
});

test("listGames returns most recent first", () => {
  const first = saveGame({
    board,
    score: 1,
    wordCount: 1,
    humanMaxScore: 10,
    humanMaxWords: 10,
    wordsToBeat: null,
  });
  const second = saveGame({
    board,
    score: 2,
    wordCount: 2,
    humanMaxScore: 10,
    humanMaxWords: 10,
    wordsToBeat: null,
  });
  expect(listGames().map((g) => g.id)).toEqual([second.id, first.id]);
});

test("deleteGame removes a single record", () => {
  const a = saveGame({
    board,
    score: 1,
    wordCount: 1,
    humanMaxScore: 10,
    humanMaxWords: 10,
    wordsToBeat: null,
  });
  const b = saveGame({
    board,
    score: 2,
    wordCount: 2,
    humanMaxScore: 10,
    humanMaxWords: 10,
    wordsToBeat: null,
  });
  deleteGame(a.id);
  expect(listGames().map((g) => g.id)).toEqual([b.id]);
});

test("clearHistory wipes everything", () => {
  saveGame({ board, score: 1, wordCount: 1, humanMaxScore: 10, humanMaxWords: 10, wordsToBeat: null });
  clearHistory();
  expect(listGames()).toEqual([]);
});

test("saveGame caps history at 200 entries, dropping the oldest", () => {
  for (let i = 0; i < 201; i++) {
    saveGame({ board, score: i, wordCount: i, humanMaxScore: 10, humanMaxWords: 10, wordsToBeat: null });
  }
  const games = listGames();
  expect(games).toHaveLength(200);
  // The oldest save (score 0) was evicted; the newest (score 200) remains.
  expect(games.some((g) => g.score === 0)).toBe(false);
  expect(games[0].score).toBe(200);
});

test("listGames tolerates corrupt storage", () => {
  localStorage.setItem("boggle:history", "{not json");
  expect(listGames()).toEqual([]);
});
