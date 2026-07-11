import { encodeChallenge, type Challenge } from './codec';

export type ShareOutcome = 'shared' | 'copied' | 'manual' | 'cancelled';

/** Build the full challenge URL (token in the `c` query param). */
export function buildChallengeUrl(c: Challenge, base: string): string {
  return `${base}?c=${encodeChallenge(c)}`;
}

/** Legacy clipboard copy that works in non-secure (HTTP) contexts. */
function legacyCopy(text: string): boolean {
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.append(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}

/**
 * Share the challenge. Prefers the native share sheet (HTTPS/secure context),
 * then the async clipboard, then a legacy copy, then a manual prompt. The
 * native sheet is only available in a secure context, so over plain HTTP the
 * copy fallbacks are used instead.
 */
export async function shareChallenge(c: Challenge): Promise<ShareOutcome> {
  const url = buildChallengeUrl(c, location.origin + location.pathname);
  const text = `Bats mon score au Boggle : ${c.scoreToBeat} pts à battre !`;

  if (navigator.share) {
    try {
      await navigator.share({ title: 'Boggle', text, url });
      return 'shared';
    } catch (err) {
      // User dismissed the sheet → genuine cancel; anything else falls through.
      if (err instanceof DOMException && err.name === 'AbortError') {
        return 'cancelled';
      }
    }
  }

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(url);
      return 'copied';
    } catch {
      /* fall through to legacy copy */
    }
  }

  if (legacyCopy(url)) return 'copied';

  // Last resort: show the link so it can be copied by hand.
  window.prompt('Copie ce lien et envoie-le à ton ami :', url);
  return 'manual';
}
