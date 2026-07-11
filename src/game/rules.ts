import type { Tile, MultiplierMap } from '../grid/generator';

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
    .join('')
    .toLowerCase();
}

/** Point value of each letter, using the French Scrabble tile values. */
const LETTER_VALUES: Record<string, number> = {
  E: 1,
  A: 1,
  I: 1,
  N: 1,
  O: 1,
  R: 1,
  S: 1,
  T: 1,
  U: 1,
  L: 1,
  D: 2,
  G: 2,
  M: 2,
  B: 3,
  C: 3,
  P: 3,
  F: 4,
  H: 4,
  V: 4,
  J: 8,
  Q: 8,
  K: 10,
  W: 10,
  X: 10,
  Y: 10,
  Z: 10,
};

/** Point value of a board tile ("Qu" is scored as Q + U = 9). */
export function letterValue(tile: Tile): number {
  const t = tile.toUpperCase();
  if (t === 'QU') return LETTER_VALUES.Q + LETTER_VALUES.U;
  return LETTER_VALUES[t] ?? 1;
}

/**
 * Extra points rewarding longer words: +5 per letter beyond 4 (nothing under 5).
 * The "Qu" tile counts as 2 letters, matching how word length is measured.
 */
export function lengthBonus(length: number): number {
  return length >= 5 ? (length - 4) * 5 : 0;
}

/**
 * Score a traced path on the board, applying the bonus tiles it crosses. Letter
 * bonuses (DL/TL) scale that tile's value; word bonuses (DW/TW) multiply the
 * whole letter sum; the length bonus is then added on top (not multiplied),
 * Ruzzle-style. The score therefore depends on the path, not just the word.
 */
export function scorePath(board: Tile[], multipliers: MultiplierMap, path: number[]): number {
  let letterSum = 0;
  let wordFactor = 1;
  for (const i of path) {
    let value = letterValue(board[i]);
    switch (multipliers[i]) {
      case 'DL':
        value *= 2;
        break;
      case 'TL':
        value *= 3;
        break;
      case 'DW':
        wordFactor *= 2;
        break;
      case 'TW':
        wordFactor *= 3;
        break;
    }
    letterSum += value;
  }
  return letterSum * wordFactor + lengthBonus(pathToWord(board, path).length);
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
