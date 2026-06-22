import { mulberry32 } from "./rng";
import { FRENCH_DICE } from "./dice";

/** A board cell: a single uppercase letter or the "Qu" digraph. */
export type Tile = string;

/** Generate a 4x4 board (row-major, 16 tiles) deterministically from a seed. */
export function generateBoard(seed: number): Tile[] {
  const rng = mulberry32(seed);
  const dice = FRENCH_DICE.map((d) => d.slice());
  // Fisher-Yates shuffle of die positions.
  for (let i = dice.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [dice[i], dice[j]] = [dice[j], dice[i]];
  }
  return dice.map((d) => d[Math.floor(rng() * 6)]);
}
