import { areAdjacent, isValidPath, pathToWord, scoreWord } from "./rules";

test("adjacency on 4x4", () => {
  expect(areAdjacent(0, 1)).toBe(true); // right
  expect(areAdjacent(0, 4)).toBe(true); // down
  expect(areAdjacent(0, 5)).toBe(true); // diagonal
  expect(areAdjacent(0, 2)).toBe(false); // too far
  expect(areAdjacent(3, 4)).toBe(false); // wraps row, not adjacent
});

test("valid path requires distinct adjacent cells", () => {
  expect(isValidPath([0, 1, 2])).toBe(true);
  expect(isValidPath([0, 1, 0])).toBe(false); // reuse
  expect(isValidPath([0, 2])).toBe(false); // not adjacent
});

test("pathToWord expands Qu and normalizes", () => {
  const board = ["Qu", "I", ...Array(14).fill("A")];
  expect(pathToWord(board, [0, 1])).toBe("qui");
});

test("scoring bareme", () => {
  expect(scoreWord("abc")).toBe(1); // 3
  expect(scoreWord("abcd")).toBe(1); // 4
  expect(scoreWord("abcde")).toBe(2); // 5
  expect(scoreWord("abcdef")).toBe(3); // 6
  expect(scoreWord("abcdefg")).toBe(5); // 7
  expect(scoreWord("abcdefgh")).toBe(11); // 8
  expect(scoreWord("abcdefghij")).toBe(11); // 8+
});
