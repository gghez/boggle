/**
 * Build the bundled French dictionary + definitions assets.
 *
 * Words: the ODS8 (Officiel du jeu Scrabble, 8th edition) word list — the
 * reference dictionary for competitive French Scrabble — so every word the
 * game accepts is one a Scrabble player would recognize as valid, with no
 * abbreviations, internet slang or other words a generic wordlist might carry.
 * Wiktionary (kaikki.org) is used only to attach a definition to each ODS8
 * word; it is streamed word-by-word and never adds new words to the
 * dictionary itself. Proper nouns and other forms Wiktionary tags as such
 * (pos "name") are skipped when picking a gloss, so a kept homograph (e.g.
 * the coin "napoléon", also the proper noun "Napoléon") never inherits a
 * proper-noun definition. Definitions are the first gloss seen per normalized
 * word, cleaned and truncated. Both files are normalized (accent-insensitive,
 * a-z, length >= 3), de-duplicated, sorted, gzipped.
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

const ODS8_URL =
  "https://raw.githubusercontent.com/kamilmielnik/scrabble-dictionaries/master/french/ods8.txt";
const WIKT_URL =
  "https://kaikki.org/frwiktionary/Fran%C3%A7ais/kaikki.org-dictionary-Fran%C3%A7ais.jsonl";

async function loadOds8Words(): Promise<Set<string>> {
  console.log(`Fetching ODS8 word list ...`);
  const res = await fetch(ODS8_URL);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
  const raw = await res.text();
  const set = new Set<string>();
  for (const w of raw.split("\n")) {
    const n = normalizeWord(w);
    if (n.length >= 3) set.add(n);
  }
  console.log(`ODS8 words: ${set.size}`);
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
  const words = await loadOds8Words();
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

    if (!words.has(word)) continue;

    const sense = entry.senses?.[0];

    // Proper nouns (surnames, given names, places, brands) are not valid Boggle
    // words. kaikki marks them with a top-level pos of "name"; skip them when
    // picking a gloss, so a kept homograph (e.g. the coin "napoléon", also the
    // proper noun "Napoléon") never inherits a proper-noun definition.
    const isProperNoun = entry.pos === "name";

    // First gloss seen for this ODS8 word (any non-proper-noun entry,
    // inflected forms included — "Pluriel de chat" is a fine gloss for a
    // base-list plural).
    const gloss = sense?.glosses?.[0];
    if (!isProperNoun && typeof gloss === "string" && gloss && !glosses.has(word)) {
      const clean = truncateGloss(cleanGloss(gloss));
      if (clean) glosses.set(word, clean);
    }
  }

  mkdirSync("public", { recursive: true });

  const dictText = [...words].sort().join("\n");
  writeFileSync("public/dictionary.bin", gzipSync(dictText));

  const defWords = [...glosses.keys()].sort();
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
