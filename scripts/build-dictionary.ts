/**
 * Build the bundled French dictionary asset.
 *
 * Source: `an-array-of-french-words` (MIT licensed open French word list).
 * https://github.com/words/an-array-of-french-words
 *
 * The script downloads the list, normalizes each entry (accent-insensitive,
 * a-z only), filters to length >= 3, de-duplicates, sorts, and gzips the
 * newline-joined result into public/dictionary.txt.gz. Only this derived
 * asset is committed; the raw source list is not.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { normalizeWord } from "../src/dictionary/normalize";

const SOURCE_URL =
  "https://raw.githubusercontent.com/words/an-array-of-french-words/master/index.json";

async function main() {
  console.log(`Fetching ${SOURCE_URL} ...`);
  const res = await fetch(SOURCE_URL);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
  const raw: string[] = await res.json();

  const set = new Set<string>();
  for (const w of raw) {
    const n = normalizeWord(w);
    if (n.length >= 3) set.add(n);
  }

  const text = [...set].sort().join("\n");
  mkdirSync("public", { recursive: true });
  writeFileSync("public/dictionary.txt.gz", gzipSync(text));
  console.log(`Wrote ${set.size} words to public/dictionary.txt.gz`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
