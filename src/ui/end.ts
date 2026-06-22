import type { Tile } from "../grid/generator";
import type { GameEngine } from "../game/engine";
import { shareChallenge } from "../share/share";
import { el, clear, toast } from "./dom";

export interface EndOptions {
  engine: GameEngine;
  board: Tile[];
  wordsToBeat: number | null;
  maxWords: number;
  maxScore: number;
  onNewGrid: () => void;
  onReplaySame: () => void;
}

/** A congratulation line scaled to the share of the grid's top score reached. */
function praiseFor(pct: number): { text: string; emoji: string } {
  if (pct >= 100) return { text: "Grille parfaite !", emoji: "👑" };
  if (pct >= 85) return { text: "Légendaire !", emoji: "🏆" };
  if (pct >= 70) return { text: "Impressionnant !", emoji: "🌟" };
  if (pct >= 50) return { text: "Excellent !", emoji: "🔥" };
  if (pct >= 30) return { text: "Joli score !", emoji: "👏" };
  if (pct >= 15) return { text: "Pas mal !", emoji: "🙂" };
  if (pct > 0) return { text: "C'est un début…", emoji: "🌱" };
  return { text: "Rien trouvé… on retente ?", emoji: "😅" };
}

/** Render the end-of-game summary with share + replay actions. */
export function renderEnd(root: HTMLElement, opts: EndOptions): void {
  const { engine, board, wordsToBeat, maxWords, maxScore, onNewGrid, onReplaySame } =
    opts;
  clear(root);

  const pct = maxScore > 0 ? Math.round((engine.score / maxScore) * 100) : 0;
  const praise = praiseFor(pct);

  const children: (Node | string)[] = [
    el("div", { className: "praise-emoji", textContent: praise.emoji }),
    el("h2", { className: "title", textContent: praise.text }),
    el("p", {
      className: "result",
      textContent: `${engine.wordCount} / ${maxWords} mots trouvés`,
    }),
    el("p", {
      className: "result result--score",
      textContent: `${engine.score} / ${maxScore} pts · ${pct}% du top`,
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
        if (res === "copied" || res === "manual") toast("Lien copié !");
      } catch {
        toast("Le partage a échoué");
      }
    },
  });

  const newGridBtn = el("button", {
    className: "btn",
    textContent: "Nouvelle grille",
    onclick: onNewGrid,
  });

  const replaySameBtn = el("button", {
    className: "btn",
    textContent: "Rejouer cette grille",
    onclick: onReplaySame,
  });

  // Found words list.
  const wordsEl = el("ul", { className: "words words--end" });
  for (const w of engine.foundWords.sort()) {
    wordsEl.append(el("li", { textContent: w.toUpperCase() }));
  }

  children.push(
    el("div", { className: "actions" }, [shareBtn, newGridBtn, replaySameBtn]),
    el("div", { className: "words-wrap" }, [wordsEl]),
  );

  root.append(el("div", { className: "screen screen--end" }, children));
}
