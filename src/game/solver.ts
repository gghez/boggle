import type { Tile } from "../grid/generator";
import { areAdjacent, pathToWord, MIN_WORD_LENGTH } from "./rules";

export interface WordDict {
  has(w: string): boolean;
  hasPrefix(p: string): boolean;
}

/**
 * Find every valid word reachable on the board (DFS with trie-prefix pruning).
 * Used to compute the theoretical maximum number of words for the progress bar.
 */
export function solveBoard(board: Tile[], dict: WordDict): Set<string> {
  const found = new Set<string>();
  const n = board.length;
  const used = new Array<boolean>(n).fill(false);
  const path: number[] = [];

  function dfs(last: number): void {
    if (path.length > 0) {
      const word = pathToWord(board, path);
      if (!dict.hasPrefix(word)) return; // prune dead branches
      if (word.length >= MIN_WORD_LENGTH && dict.has(word)) found.add(word);
    }
    for (let i = 0; i < n; i++) {
      if (used[i]) continue;
      if (last >= 0 && !areAdjacent(last, i)) continue;
      used[i] = true;
      path.push(i);
      dfs(i);
      path.pop();
      used[i] = false;
    }
  }

  dfs(-1);
  return found;
}

/** Count the maximum number of words on the board. */
export function countWords(board: Tile[], dict: WordDict): number {
  return solveBoard(board, dict).size;
}
