/**
 * Persisted on/off preference for game sounds. Stored in localStorage so the
 * choice survives across games and sessions. Sounds are on by default; any
 * storage failure (private mode, disabled) degrades to "on" without throwing.
 */

const STORAGE_KEY = 'boggle:sound';

/** Whether game sounds are currently enabled (defaults to on). */
export function isSoundEnabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'off';
  } catch {
    return true;
  }
}

/** Persist the sound on/off preference. */
export function setSoundEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? 'on' : 'off');
  } catch {
    // Storage unavailable — the preference just won't persist this session.
  }
}
