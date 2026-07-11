import type { Tile } from '../grid/generator';

/** A completed game, as logged to the local history. */
export interface GameRecord {
  id: string;
  /** ISO timestamp of when the game ended. */
  playedAt: string;
  board: Tile[];
  score: number;
  wordCount: number;
  humanMaxScore: number;
  humanMaxWords: number;
  /** Word count to beat if this was a challenge, null for a plain game. */
  wordsToBeat: number | null;
}

const STORAGE_KEY = 'boggle:history';
// Bound storage growth: drop the oldest entries past this count.
const MAX_ENTRIES = 200;

function randomId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function readAll(): GameRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as GameRecord[]) : [];
  } catch {
    // Corrupt data or storage unavailable (private browsing, disabled, etc.):
    // history is a non-critical enhancement, so fail quiet with an empty list.
    return [];
  }
}

function writeAll(records: GameRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    // Storage full or unavailable — drop silently rather than break the game.
  }
}

/** All logged games, most recent first. */
export function listGames(): GameRecord[] {
  return readAll().sort((a, b) => b.playedAt.localeCompare(a.playedAt));
}

/** Log a completed game and return the stored record. */
export function saveGame(record: Omit<GameRecord, 'id' | 'playedAt'>): GameRecord {
  const full: GameRecord = { ...record, id: randomId(), playedAt: new Date().toISOString() };
  const records = [full, ...readAll()].slice(0, MAX_ENTRIES);
  writeAll(records);
  return full;
}

/** Remove a single game from the history. */
export function deleteGame(id: string): void {
  writeAll(readAll().filter((r) => r.id !== id));
}

/** Wipe the whole history. */
export function clearHistory(): void {
  writeAll([]);
}
