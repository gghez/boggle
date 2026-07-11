import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';

// Guards the shipped dictionary asset against proper-noun regressions. The asset
// is rebuilt by `npm run build:dict`; this test locks the outcome without
// needing the ~3 GB Wiktionary source.
const words = new Set(
  gunzipSync(readFileSync('public/dictionary.bin')).toString('utf8').split('\n'),
);

test('pure proper nouns are excluded', () => {
  // Surnames / place names whose only dictionary sense is a proper noun.
  for (const w of [
    'benon',
    'dupont',
    'durand',
    'zidane',
    'chirac',
    'sarkozy',
    'lefebvre',
    'france',
  ]) {
    expect(words.has(w)).toBe(false);
  }
});

test('common words are kept, including proper-noun homographs', () => {
  // Plain common words, plus words that are also proper nouns but carry a real
  // common sense: napoleon (a gold coin), macron (the diacritic), paris (plural
  // of "pari"). These are legitimately valid words.
  for (const w of ['chat', 'maison', 'ordinateur', 'watt', 'napoleon', 'macron', 'paris']) {
    expect(words.has(w)).toBe(true);
  }
});
