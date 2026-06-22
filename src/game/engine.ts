import type { Tile } from "../grid/generator";
import { isValidPath, pathToWord, scoreWord, MIN_WORD_LENGTH } from "./rules";

export type SubmitResult =
  | "valid-new"
  | "valid-duplicate"
  | "invalid-path"
  | "not-a-word"
  | "too-short";

export class GameEngine {
  private _score = 0;
  private _found = new Set<string>();
  constructor(
    private board: Tile[],
    private dict: { has: (w: string) => boolean },
  ) {}

  submitPath(path: number[]): SubmitResult {
    if (!isValidPath(path)) return "invalid-path";
    const word = pathToWord(this.board, path);
    if (word.length < MIN_WORD_LENGTH) return "too-short";
    if (!this.dict.has(word)) return "not-a-word";
    if (this._found.has(word)) return "valid-duplicate";
    this._found.add(word);
    this._score += scoreWord(word);
    return "valid-new";
  }

  get score(): number {
    return this._score;
  }
  get foundWords(): string[] {
    return [...this._found];
  }
  get wordCount(): number {
    return this._found.size;
  }
}
