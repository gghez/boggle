# Boggle PWA (FR)

A French Boggle game as an installable, offline-capable PWA. Generate a 4×4
grid, find as many words as possible in 3 minutes by swiping across adjacent
letters, then challenge a friend through the native share sheet — they play the
same grid and see how many words they have to beat. No backend: the whole
challenge is encoded in the shared URL.

## Stack

Vite + TypeScript, Vitest for the pure game logic, `vite-plugin-pwa` for the
service worker and manifest.

## Develop

```bash
npm install
npm run build:dict   # one-time: build the bundled French dictionary asset
npm run dev          # dev server
npm test             # unit tests
npm run build        # production build (dist/)
npm run preview      # serve the production build
```

## How it works

- `src/grid/` — seeded PRNG + authentic French Boggle dice → 4×4 board.
- `src/dictionary/` — accent-insensitive normalization, a `Set` + prefix trie
  loaded from a gzipped word list (built by `scripts/build-dictionary.ts`).
- `src/game/` — rules (adjacency, "Qu" handling, scoring), engine, countdown.
- `src/input/swipe.ts` — pointer-based path tracking, validated on release.
- `src/share/` — encode/decode the challenge into a URL token, native share.
- `src/ui/` — Home / Game / End screens.

## Rules

4×4 grid, words ≥ 3 letters, 8-direction adjacency, no cell reuse. "Qu" is one
cell but two letters. Scoring by length: 3-4 = 1, 5 = 2, 6 = 3, 7 = 5, 8+ = 11.
Validation is accent-insensitive.

## Dictionary

Built at install time from
[`an-array-of-french-words`](https://github.com/words/an-array-of-french-words)
(MIT). Only the derived `public/dictionary.bin` (gzip-compressed, decompressed
in-app) is committed.
