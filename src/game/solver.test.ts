import { solveBoard, countWords, solveBoardWithPaths } from "./solver";
import { Dictionary } from "../dictionary";
import { areAdjacent, pathToWord } from "./rules";

// Row 0: C A T  (indices 0,1,2 adjacent in a line); rest filler "X".
const board = ["C","A","T","X","X","X","X","X","X","X","X","X","X","X","X","X"];

test("finds reachable words of length >= 3", () => {
  const dict = new Dictionary(["cat", "ca", "at"]);
  const words = solveBoard(board, dict);
  expect(words.has("cat")).toBe(true); // path 0-1-2
  expect([...words].every((w) => w.length >= 3)).toBe(true); // "ca"/"at" excluded
});

test("counts max words", () => {
  const dict = new Dictionary(["cat", "tac"]);
  // both "cat" (0,1,2) and "tac" (2,1,0) are reachable
  expect(countWords(board, dict)).toBe(2);
});

test("short words are excluded", () => {
  const dict = new Dictionary(["ca", "at"]);
  expect(countWords(board, dict)).toBe(0);
});

test("solveBoardWithPaths returns a valid path for each word", () => {
  const dict = new Dictionary(["cat", "tac"]);
  const paths = solveBoardWithPaths(board, dict);
  expect(new Set(paths.keys())).toEqual(new Set(["cat", "tac"]));
  for (const [word, path] of paths) {
    expect(pathToWord(board, path)).toBe(word);
    expect(new Set(path).size).toBe(path.length); // no repeated cell
    for (let i = 1; i < path.length; i++) {
      expect(areAdjacent(path[i - 1], path[i])).toBe(true);
    }
  }
});

test("solveBoard keys match solveBoardWithPaths keys", () => {
  const dict = new Dictionary(["cat", "tac"]);
  expect(solveBoard(board, dict)).toEqual(new Set(solveBoardWithPaths(board, dict).keys()));
});
