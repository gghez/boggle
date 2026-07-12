import {
  generateBoard,
  generateMultipliers,
  type Tile,
  type Multiplier,
  type MultiplierMap,
} from '../grid/generator';

/**
 * A shareable challenge: a board plus the score to beat. When the board's
 * generating `seed` is known, the token collapses to a handful of characters —
 * the letters and the bonus layout are fully regenerated from that seed on the
 * other end. Without a seed (a legacy link or a pre-seed history record) the
 * whole board is serialized in the older `v2` form instead.
 */
export type Challenge = {
  seed?: number;
  board: Tile[];
  multipliers: MultiplierMap;
  scoreToBeat: number;
};

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

// --- Compact seed form: "<seed base36>.<score base36>" ---
// A single 32-bit seed regenerates the exact board and bonus layout, so a
// challenge only needs that seed and the score to beat. The '.' separator is
// absent from the base64url alphabet, so the compact and legacy forms can never
// be confused when decoding.
const COMPACT_RE = /^([0-9a-z]+)\.([0-9a-z]+)$/;

function encodeCompact(seed: number, scoreToBeat: number): string {
  return `${(seed >>> 0).toString(36)}.${scoreToBeat.toString(36)}`;
}

function decodeCompact(token: string): Challenge | null {
  const m = COMPACT_RE.exec(token);
  if (!m) return null;
  const seed = parseInt(m[1], 36);
  const scoreToBeat = parseInt(m[2], 36);
  if (!Number.isSafeInteger(seed) || !Number.isSafeInteger(scoreToBeat)) return null;
  return { seed, board: generateBoard(seed), multipliers: generateMultipliers(seed), scoreToBeat };
}

function encodeLegacy(c: Challenge): string {
  const payload = JSON.stringify(['v2', c.board, c.multipliers, c.scoreToBeat]);
  return toUrlSafe(btoa(unescape(encodeURIComponent(payload))));
}

function decodeLegacy(token: string): Challenge | null {
  try {
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

/**
 * Encode a challenge into a compact URL-safe token. When the generating seed is
 * known the token is a tiny "seed.score" pair; otherwise the whole board is
 * serialized in the legacy form.
 */
export function encodeChallenge(c: Challenge): string {
  if (c.seed != null && Number.isSafeInteger(c.scoreToBeat) && c.scoreToBeat >= 0) {
    return encodeCompact(c.seed, c.scoreToBeat);
  }
  return encodeLegacy(c);
}

/** Decode a challenge token; returns null on corrupt or unexpected input. */
export function decodeChallenge(token: string): Challenge | null {
  if (!token) return null;
  return decodeCompact(token) ?? decodeLegacy(token);
}
