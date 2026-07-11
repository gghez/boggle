import type { Tile, Multiplier, MultiplierMap } from '../grid/generator';

export type Challenge = { board: Tile[]; multipliers: MultiplierMap; scoreToBeat: number };

const MULTIPLIERS: readonly Multiplier[] = ['DL', 'TL', 'DW', 'TW'];

/** Validate a decoded multiplier map: 16 slots, each null or a known bonus. */
function isMultiplierMap(v: unknown): v is MultiplierMap {
  return (
    Array.isArray(v) &&
    v.length === 16 &&
    v.every((m) => m === null || (typeof m === 'string' && MULTIPLIERS.includes(m as Multiplier)))
  );
}

function toUrlSafe(b64: string): string {
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function fromUrlSafe(s: string): string {
  return s.replace(/-/g, '+').replace(/_/g, '/');
}

/** Encode a challenge into a compact URL-safe token. */
export function encodeChallenge(c: Challenge): string {
  const payload = JSON.stringify(['v2', c.board, c.multipliers, c.scoreToBeat]);
  return toUrlSafe(btoa(unescape(encodeURIComponent(payload))));
}

/** Decode a challenge token; returns null on corrupt or unexpected input. */
export function decodeChallenge(token: string): Challenge | null {
  try {
    if (!token) return null;
    const json = decodeURIComponent(escape(atob(fromUrlSafe(token))));
    const data: unknown = JSON.parse(json);
    if (!Array.isArray(data) || data[0] !== 'v2') return null;
    const [, board, multipliers, scoreToBeat] = data as [string, unknown, unknown, unknown];
    if (!Array.isArray(board) || board.length !== 16) return null;
    if (!isMultiplierMap(multipliers)) return null;
    if (typeof scoreToBeat !== 'number') return null;
    return { board: board as Tile[], multipliers, scoreToBeat };
  } catch {
    return null;
  }
}
