import { normalizeWord } from './normalize';

test('lowercases and strips accents', () => {
  expect(normalizeWord('Élève')).toBe('eleve');
  expect(normalizeWord('CŒUR')).toBe('coeur');
  expect(normalizeWord('naïf')).toBe('naif');
  expect(normalizeWord('Çà')).toBe('ca');
});

test('drops non-letters', () => {
  expect(normalizeWord("aujourd'hui")).toBe('aujourdhui');
  expect(normalizeWord('  abc-def ')).toBe('abcdef');
});
