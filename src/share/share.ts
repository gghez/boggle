import { encodeChallenge, type Challenge } from "./codec";

/** Build the full challenge URL (token in the `c` query param). */
export function buildChallengeUrl(c: Challenge, base: string): string {
  return `${base}?c=${encodeChallenge(c)}`;
}

/** Share via the native share sheet, falling back to clipboard copy. */
export async function shareChallenge(c: Challenge): Promise<"shared" | "copied"> {
  const url = buildChallengeUrl(c, location.origin + location.pathname);
  const text = `Bats mon score au Boggle : ${c.wordsToBeat} mots à battre !`;
  if (navigator.share) {
    await navigator.share({ title: "Boggle", text, url });
    return "shared";
  }
  await navigator.clipboard.writeText(url);
  return "copied";
}
