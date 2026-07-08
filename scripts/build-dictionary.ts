/**
 * Build the bundled French dictionary + definitions assets.
 *
 * Words: the `an-array-of-french-words` base list (MIT) unioned with the LEMMA
 * entries of the French Wiktionary extraction (kaikki.org) — proper nouns (pos
 * "name": surnames, given names, places, brands — forbidden in Boggle),
 * inflected forms (first sense tagged "form-of" or carrying a `form_of` field)
 * and multi-word locutions (raw `word` contains a space) are excluded, so the
 * game gains missing common words (fan, geek, web, ...) without ballooning to
 * the full ~1.8M-entry Wiktionary. Definitions: the first gloss seen per normalized
 * word, cleaned and truncated, kept ONLY for words that end up in the
 * dictionary. Both are normalized (accent-insensitive, a-z, length >= 3),
 * de-duplicated, sorted, gzipped.
 *
 * The `.bin` extension (not `.gz`) is deliberate: it stops static servers from
 * applying a transport-level `Content-Encoding: gzip`, so the app decompresses
 * the raw gzip bytes itself consistently across hosts.
 *
 * The Wiktionary source is ~3 GB; it is streamed line-by-line and never held in
 * memory or committed. Set KAIKKI_LOCAL=/path/to/fr.jsonl to reuse a
 * pre-downloaded copy instead of re-fetching.
 */
import { writeFileSync, mkdirSync, statSync, createReadStream } from "node:fs";
import { gzipSync } from "node:zlib";
import { createInterface } from "node:readline";
import { Readable } from "node:stream";
import { normalizeWord } from "../src/dictionary/normalize";
import { cleanGloss, truncateGloss } from "./gloss";

const WORDS_URL =
  "https://raw.githubusercontent.com/words/an-array-of-french-words/master/index.json";
const WIKT_URL =
  "https://kaikki.org/frwiktionary/Fran%C3%A7ais/kaikki.org-dictionary-Fran%C3%A7ais.jsonl";

async function loadBaseWords(): Promise<Set<string>> {
  console.log(`Fetching base word list ...`);
  const res = await fetch(WORDS_URL);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
  const raw: string[] = await res.json();
  const set = new Set<string>();
  for (const w of raw) {
    const n = normalizeWord(w);
    if (n.length >= 3) set.add(n);
  }
  console.log(`Base words: ${set.size}`);
  return set;
}

async function wiktionaryLines(): Promise<AsyncIterable<string>> {
  const local = process.env.KAIKKI_LOCAL;
  let input: Readable;
  if (local) {
    console.log(`Reading Wiktionary from local file ${local} ...`);
    input = createReadStream(local, { encoding: "utf8" });
  } else {
    console.log(`Streaming Wiktionary from ${WIKT_URL} (~3 GB) ...`);
    const res = await fetch(WIKT_URL);
    if (!res.ok || !res.body) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
    input = Readable.fromWeb(res.body as Parameters<typeof Readable.fromWeb>[0]);
  }
  return createInterface({ input, crlfDelay: Infinity });
}

interface WiktSense {
  glosses?: string[];
  tags?: string[];
  form_of?: unknown[];
}
interface WiktEntry {
  word?: string;
  pos?: string;
  senses?: WiktSense[];
}

async function main() {
  const words = await loadBaseWords();
  const glosses = new Map<string, string>();

  let seen = 0;
  for await (const line of await wiktionaryLines()) {
    if (!line) continue;
    if (++seen % 200000 === 0) console.log(`  ...${seen} entries scanned`);
    let entry: WiktEntry;
    try {
      entry = JSON.parse(line);
    } catch {
      continue;
    }
    const raw = entry.word ?? "";
    const word = normalizeWord(raw);
    if (word.length < 3) continue;

    const sense = entry.senses?.[0];

    // Proper nouns (surnames, given names, places, brands) are not valid Boggle
    // words. kaikki marks them with a top-level pos of "name"; skip them for
    // both the dictionary and gloss capture, so a kept homograph (e.g. the coin
    // "napoléon", also the proper noun "Napoléon") never inherits a proper-noun
    // definition.
    const isProperNoun = entry.pos === "name";

    // First gloss seen for this normalized word (any non-proper-noun entry,
    // inflected forms included — "Pluriel de chat" is a fine gloss for a
    // base-list plural).
    const gloss = sense?.glosses?.[0];
    if (!isProperNoun && typeof gloss === "string" && gloss && !glosses.has(word)) {
      const clean = truncateGloss(cleanGloss(gloss));
      if (clean) glosses.set(word, clean);
    }

    // Only common-word lemmas extend the dictionary: skip proper nouns (pos
    // "name"), inflected forms (tagged "form-of" / carrying form_of) and
    // multi-word locutions (space in raw). This keeps the word count sane for
    // gameplay (~642k, not ~1.8M).
    const isInflected =
      (sense?.tags?.includes("form-of") ?? false) || (sense?.form_of?.length ?? 0) > 0;
    if (!isProperNoun && !isInflected && !raw.includes(" ")) words.add(word);
  }

  mkdirSync("public", { recursive: true });

  const dictText = [...words].sort().join("\n");
  writeFileSync("public/dictionary.bin", gzipSync(dictText));

  // Ship a gloss only for words that are actually in the dictionary.
  const defWords = [...glosses.keys()].filter((w) => words.has(w)).sort();
  const defsText = defWords.map((w) => `${w}\t${glosses.get(w)}`).join("\n");
  writeFileSync("public/definitions.bin", gzipSync(defsText));

  const defsMb = (statSync("public/definitions.bin").size / 1024 / 1024).toFixed(2);
  console.log(`Wrote ${words.size} words -> public/dictionary.bin`);
  console.log(`Wrote ${defWords.length} glosses -> public/definitions.bin (${defsMb} MB)`);
  if (Number(defsMb) >= 10) {
    console.warn(`WARNING: definitions.bin >= 10 MB — lower the truncation length passed to truncateGloss.`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
