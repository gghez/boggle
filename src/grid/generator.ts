import { mulberry32 } from './rng';
import { FRENCH_DICE } from './dice';

/** A board cell: a single uppercase letter or the "Qu" digraph. */
export type Tile = string;

/**
 * A Ruzzle-style bonus tile: DL/TL double/triple the letter's value, DW/TW
 * double/triple the whole word's score. A board carries a parallel 16-slot map
 * where most slots are null and a few hold one of these.
 */
export type Multiplier = 'DL' | 'TL' | 'DW' | 'TW';

/** Bonus tiles parallel to the board (16 slots, null where a cell is plain). */
export type MultiplierMap = (Multiplier | null)[];

/** How many bonus tiles a fresh board carries (2 letter, 2 word). */
const LETTER_BONUS_COUNT = 2;
const WORD_BONUS_COUNT = 2;

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

/**
 * Place the bonus tiles deterministically from the same seed, on its own PRNG
 * stream (decorrelated from the letter layout) so the bonuses don't shift when
 * the dice roll changes. Picks 2 letter cells (mostly DL, sometimes TL) and 2
 * word cells (mostly DW, sometimes TW) among distinct positions.
 */
export function generateMultipliers(seed: number): MultiplierMap {
  const rng = mulberry32((seed ^ 0x5bd1e995) >>> 0);
  const map: MultiplierMap = new Array<Multiplier | null>(16).fill(null);
  const cells = Array.from({ length: 16 }, (_, i) => i);
  // Fisher-Yates; the first (LETTER+WORD) cells are the bonus positions.
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }
  let k = 0;
  // The triple tier is the rarer, ~1-in-3 upgrade of each bonus.
  for (let n = 0; n < LETTER_BONUS_COUNT; n++) map[cells[k++]] = rng() < 0.34 ? 'TL' : 'DL';
  for (let n = 0; n < WORD_BONUS_COUNT; n++) map[cells[k++]] = rng() < 0.34 ? 'TW' : 'DW';
  return map;
}
