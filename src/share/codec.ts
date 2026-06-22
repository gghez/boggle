import type { Tile } from "../grid/generator";

export type Challenge = { board: Tile[]; wordsToBeat: number };

function toUrlSafe(b64: string): string {
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function fromUrlSafe(s: string): string {
  return s.replace(/-/g, "+").replace(/_/g, "/");
}

/** Encode a challenge into a compact URL-safe token. */
export function encodeChallenge(c: Challenge): string {
  const payload = JSON.stringify(["v1", c.board, c.wordsToBeat]);
  return toUrlSafe(btoa(unescape(encodeURIComponent(payload))));
}

/** Decode a challenge token; returns null on corrupt or unexpected input. */
export function decodeChallenge(token: string): Challenge | null {
  try {
    if (!token) return null;
    const json = decodeURIComponent(escape(atob(fromUrlSafe(token))));
    const data = JSON.parse(json);
    if (!Array.isArray(data) || data[0] !== "v1") return null;
    const [, board, wordsToBeat] = data;
    if (!Array.isArray(board) || board.length !== 16) return null;
    if (typeof wordsToBeat !== "number") return null;
    return { board, wordsToBeat };
  } catch {
    return null;
  }
}
