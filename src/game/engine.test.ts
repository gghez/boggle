import { GameEngine } from "./engine";

const dict = { has: (w: string) => ["qui", "oui", "car"].includes(w) };
// indices: 0=Qu 1=I 2=O 3=U | 4=C 5=A 6=R 7=A | rest A
const board = ["Qu","I","O","U","C","A","R","A","A","A","A","A","A","A","A","A"];

test("valid new word scores and is recorded", () => {
  const g = new GameEngine(board, dict);
  expect(g.submitPath([0, 1])).toBe("valid-new"); // "qui"
  expect(g.wordCount).toBe(1);
  expect(g.score).toBe(1);
});

test("duplicate not rescored", () => {
  const g = new GameEngine(board, dict);
  g.submitPath([0, 1]);
  expect(g.submitPath([0, 1])).toBe("valid-duplicate");
  expect(g.wordCount).toBe(1);
});

test("too short rejected", () => {
  const g = new GameEngine(board, dict);
  expect(g.submitPath([1])).toBe("too-short");
});

test("invalid path rejected", () => {
  const g = new GameEngine(board, dict);
  expect(g.submitPath([0, 2])).toBe("invalid-path"); // not adjacent
});

test("not a word rejected", () => {
  const g = new GameEngine(board, dict);
  expect(g.submitPath([2, 1, 0])).toBe("not-a-word"); // "oiqu"
});

test("car is a valid word", () => {
  const g = new GameEngine(board, dict);
  expect(g.submitPath([4, 5, 6])).toBe("valid-new"); // "car"
});
