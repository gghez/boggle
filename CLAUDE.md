# Boggle PWA

French Boggle game: find as many words as possible in 3 minutes.

## Stack

- **Language**: TypeScript (strict), ES modules. No UI framework — direct DOM via the `el`/`clear` helpers in `src/ui/dom.ts`.
- **Build/dev**: Vite 6.
- **PWA**: `vite-plugin-pwa` (Workbox service worker, `autoUpdate`), offline-capable.
- **Tests**: Vitest + jsdom.
- **Dictionary**: two prebuilt gzip-compressed binaries decompressed in-app —
  `public/dictionary.bin` (word list: `an-array-of-french-words` unioned with
  French Wiktionary lemma entries, inflected forms and locutions excluded) and
  `public/definitions.bin` (TSV `word⇥gloss`, lazy-loaded on the end screen).
  Regenerate both with `npm run build:dict` (tsx script).
- **Hosting**: Netlify static site, no backend.

## Scripts

- `npm run dev` — local dev server.
- `npm run build` — `tsc --noEmit` then `vite build` (output in `dist/`).
- `npm test` — run Vitest once.

## Deployment

- Pushing to `main` triggers a Netlify deploy to https://boggle-gghez.netlify.app/ (continuous deployment).
- Manual CLI deploys (`npx netlify`) and details: @docs/agent-references/deployment.md
