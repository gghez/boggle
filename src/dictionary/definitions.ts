import { normalizeWord } from "./normalize";

/** Accent-insensitive gloss lookup keyed by normalized word. */
export class DefinitionLookup {
  constructor(private map: Map<string, string>) {}

  get(word: string): string | null {
    return this.map.get(normalizeWord(word)) ?? null;
  }

  get size(): number {
    return this.map.size;
  }
}

/** Parse the TSV payload (`normalizedWord<TAB>gloss` per line) into a map. */
export function parseDefinitions(text: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const line of text.split("\n")) {
    if (!line) continue;
    const tab = line.indexOf("\t");
    if (tab < 0) continue;
    const word = line.slice(0, tab);
    const gloss = line.slice(tab + 1);
    if (word && gloss) map.set(word, gloss);
  }
  return map;
}

/**
 * Fetch and decompress the bundled definitions asset. Never throws: on any
 * failure (missing asset, offline before first cache) it resolves to an empty
 * lookup so the end screen still renders (words show "Definition indisponible").
 */
export async function loadDefinitions(): Promise<DefinitionLookup> {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}definitions.bin`);
    if (!res.ok) throw new Error(String(res.status));
    const ds = new DecompressionStream("gzip");
    const stream = res.body!.pipeThrough(ds);
    const text = await new Response(stream).text();
    return new DefinitionLookup(parseDefinitions(text));
  } catch {
    return new DefinitionLookup(new Map());
  }
}
