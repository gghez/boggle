/**
 * Normalize a word for accent-insensitive dictionary lookups:
 * lowercase, expand œ/æ ligatures, strip diacritics, keep only a-z.
 */
export function normalizeWord(raw: string): string {
  return raw
    .replace(/œ/gi, 'oe')
    .replace(/æ/gi, 'ae')
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[̀-ͯ]/g, '') // combining diacritics
    .replace(/[^a-z]/g, '');
}
