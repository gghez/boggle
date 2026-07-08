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

/**
 * Seconds a player needs, at a standard non-stop pace, to spot and trace one
 * word. This sets an input-throughput ceiling: setting vocabulary aside, nobody
 * can enter more than `timer / SECONDS_PER_WORD` words in a game.
 */
export const SECONDS_PER_WORD = 4;

/**
 * The best score a human could realistically reach on a board, used to scale the
 * end-screen rating. The ceiling is bounded not by vocabulary but by input
 * throughput: in `timerSeconds`, a player entering words non-stop can play at
 * most `timerSeconds / SECONDS_PER_WORD` of them, so the max obtainable is the
 * sum of that many highest-scoring words (fewer if the board holds less).
 */
export function humanReach(
  wordScores: number[],
  timerSeconds: number,
): { words: number; score: number } {
  const cap = Math.floor(timerSeconds / SECONDS_PER_WORD);
  const top = wordScores
    .slice()
    .sort((a, b) => b - a)
    .slice(0, cap);
  return { words: top.length, score: top.reduce((sum, s) => sum + s, 0) };
}
