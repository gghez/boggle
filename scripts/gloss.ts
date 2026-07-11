/** Collapse all whitespace (newlines, tabs, runs of spaces) into single spaces. */
export function cleanGloss(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim();
}

/**
 * Truncate to at most `max` chars, cutting on a word boundary and appending an
 * ellipsis only when the text was actually cut. Assumes input already cleaned.
 */
export function truncateGloss(text: string, max = 140): string {
  if (text.length <= max) return text;
  const slice = text.slice(0, max);
  const lastSpace = slice.lastIndexOf(' ');
  const cut = lastSpace > 40 ? slice.slice(0, lastSpace) : slice;
  return cut.replace(/[\s,;:.]+$/, '') + '…';
}
