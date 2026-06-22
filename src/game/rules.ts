import type { Tile } from "../grid/generator";

export const GRID_SIZE = 4;
export const MIN_WORD_LENGTH = 3;

/** Whether two cell indices (0..15) are adjacent in any of the 8 directions. */
export function areAdjacent(a: number, b: number): boolean {
  if (a === b) return false;
  const ra = Math.floor(a / GRID_SIZE);
  const ca = a % GRID_SIZE;
  const rb = Math.floor(b / GRID_SIZE);
  const cb = b % GRID_SIZE;
  return Math.abs(ra - rb) <= 1 && Math.abs(ca - cb) <= 1;
}

/** A path is valid if all cells are distinct and consecutive cells are adjacent. */
export function isValidPath(path: number[]): boolean {
  if (new Set(path).size !== path.length) return false;
  for (let i = 1; i < path.length; i++) {
    if (!areAdjacent(path[i - 1], path[i])) return false;
  }
  return true;
}

/** Build the normalized word from a path (tiles joined, "Qu" → "qu"). */
export function pathToWord(board: Tile[], path: number[]): string {
  return path
    .map((i) => board[i])
    .join("")
    .toLowerCase();
}

/** Boggle scoring barème by word length. */
export function scoreWord(word: string): number {
  const n = word.length;
  if (n <= 4) return 1;
  if (n === 5) return 2;
  if (n === 6) return 3;
  if (n === 7) return 5;
  return 11;
}
