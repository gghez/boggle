import { Dictionary, buildTrie, hasPrefix } from './index';

test('trie prefix lookups', () => {
  const t = buildTrie(['chat', 'chien', 'chien']);
  expect(hasPrefix(t, 'ch')).toBe(true);
  expect(hasPrefix(t, 'chie')).toBe(true);
  expect(hasPrefix(t, 'xy')).toBe(false);
});

test('Dictionary membership + prefix', () => {
  const d = new Dictionary(['chat', 'chien']);
  expect(d.has('chat')).toBe(true);
  expect(d.has('chien')).toBe(true);
  expect(d.has('xyz')).toBe(false);
  expect(d.hasPrefix('ch')).toBe(true);
  expect(d.hasPrefix('zz')).toBe(false);
});
