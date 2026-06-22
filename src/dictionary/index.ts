export type TrieNode = { children: Map<string, TrieNode>; end: boolean };

export function buildTrie(words: Iterable<string>): TrieNode {
  const root: TrieNode = { children: new Map(), end: false };
  for (const w of words) {
    let node = root;
    for (const ch of w) {
      let next = node.children.get(ch);
      if (!next) {
        next = { children: new Map(), end: false };
        node.children.set(ch, next);
      }
      node = next;
    }
    node.end = true;
  }
  return root;
}

export function hasPrefix(trie: TrieNode, prefix: string): boolean {
  let node = trie;
  for (const ch of prefix) {
    const next = node.children.get(ch);
    if (!next) return false;
    node = next;
  }
  return true;
}

export class Dictionary {
  private set: Set<string>;
  private trie: TrieNode;
  constructor(words: Iterable<string>) {
    this.set = new Set(words);
    this.trie = buildTrie(this.set);
  }
  has(word: string): boolean {
    return this.set.has(word);
  }
  hasPrefix(p: string): boolean {
    return hasPrefix(this.trie, p);
  }
}

/** Fetch and decompress the bundled gzip word list into a Dictionary. */
export async function loadDictionary(): Promise<Dictionary> {
  const res = await fetch(`${import.meta.env.BASE_URL}dictionary.bin`);
  const ds = new DecompressionStream("gzip");
  const stream = res.body!.pipeThrough(ds);
  const text = await new Response(stream).text();
  return new Dictionary(text.split("\n").filter(Boolean));
}
