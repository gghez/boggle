import type { Tile } from "../grid/generator";
import type { GameEngine } from "../game/engine";
import { shareChallenge } from "../share/share";
import { el, clear, toast } from "./dom";

export interface EndOptions {
  engine: GameEngine;
  board: Tile[];
  wordsToBeat: number | null;
  onReplay: () => void;
}

/** Render the end-of-game summary with share + replay actions. */
export function renderEnd(root: HTMLElement, opts: EndOptions): void {
  const { engine, board, wordsToBeat, onReplay } = opts;
  clear(root);

  const children: (Node | string)[] = [
    el("h2", { className: "title", textContent: "Temps écoulé !" }),
    el("p", {
      className: "result",
      textContent: `${engine.wordCount} mots — ${engine.score} pts`,
    }),
  ];

  if (wordsToBeat != null) {
    const beaten = engine.wordCount > wordsToBeat;
    const tied = engine.wordCount === wordsToBeat;
    children.push(
      el("p", {
        className: beaten ? "verdict verdict--win" : "verdict verdict--lose",
        textContent: beaten
          ? "Tu as battu le score ! 🎉"
          : tied
            ? "Égalité !"
            : `Pas battu (${wordsToBeat} à battre).`,
      }),
    );
  }

  const shareBtn = el("button", {
    className: "btn btn--primary",
    textContent: "Défier un ami",
    onclick: async () => {
      try {
        const res = await shareChallenge({ board, wordsToBeat: engine.wordCount });
        if (res === "copied") toast("Lien copié !");
      } catch {
        toast("Partage annulé");
      }
    },
  });

  const replayBtn = el("button", {
    className: "btn",
    textContent: "Rejouer",
    onclick: onReplay,
  });

  // Found words list.
  const wordsEl = el("ul", { className: "words words--end" });
  for (const w of engine.foundWords.sort()) {
    wordsEl.append(el("li", { textContent: w.toUpperCase() }));
  }

  children.push(
    el("div", { className: "actions" }, [shareBtn, replayBtn]),
    el("div", { className: "words-wrap" }, [wordsEl]),
  );

  root.append(el("div", { className: "screen screen--end" }, children));
}
