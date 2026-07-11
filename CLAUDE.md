# Boggle PWA

French Boggle game: find as many words as possible in 3 minutes.

## Stack

- **Language**: TypeScript (strict), ES modules. No UI framework — direct DOM via the `el`/`clear` helpers in `src/ui/dom.ts`.
- **Build/dev**: Vite 6.
- **PWA**: `vite-plugin-pwa` (Workbox service worker, `autoUpdate`), offline-capable.
- **Tests**: Vitest + jsdom.
- **Dictionary**: two prebuilt gzip-compressed binaries decompressed in-app —
  `public/dictionary.bin` (word list: ODS8, the official French Scrabble
  dictionary, so only words officially valid for Scrabble are accepted — no
  abbreviations or slang) and `public/definitions.bin` (TSV `word⇥gloss`,
  glosses sourced from French Wiktionary for ODS8 words, lazy-loaded on the
  end screen). Regenerate both with `npm run build:dict` (tsx script).
- **Hosting**: Netlify static site, no backend.

## Rules

Game rules and the board-generation algorithm live in `docs/RULES.md`, and are
readable in-app on a dedicated screen (`src/ui/rules.ts`) reachable via the "?"
help button on the home and end screens.

## Scripts

- `npm run dev` — local dev server.
- `npm run build` — `tsc --noEmit` then `vite build` (output in `dist/`).
- `npm test` — run Vitest once.

## Deployment

- Pushing to `main` triggers a Netlify deploy to https://boggle-gghez.netlify.app/ (continuous deployment).
- Manual CLI deploys (`npx netlify`) and details: @docs/agent-references/deployment.md
