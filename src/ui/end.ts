import type { Tile } from "../grid/generator";
import type { GameEngine } from "../game/engine";
import type { DefinitionLookup } from "../dictionary/definitions";
import { shareChallenge } from "../share/share";
import { createBoardView } from "./board-view";
import { el, clear, toast } from "./dom";

export interface EndOptions {
  engine: GameEngine;
  board: Tile[];
  wordsToBeat: number | null;
  maxWords: number;
  maxScore: number;
  paths: Map<string, number[]>;
  definitions: Promise<DefinitionLookup>;
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

/** Render the end-of-game summary: tap a word to trace it + read its gloss. */
export function renderEnd(root: HTMLElement, opts: EndOptions): void {
  const { engine, board, wordsToBeat, maxWords, maxScore, paths, definitions, onNewGrid, onReplaySame } =
    opts;
  clear(root);

  const pct = maxScore > 0 ? Math.round((engine.score / maxScore) * 100) : 0;
  const praise = praiseFor(pct);

  const found = engine.foundWords.slice().sort();
  const foundSet = new Set(found);
  const missed = [...paths.keys()].filter((w) => !foundSet.has(w)).sort();

  // Compact summary line.
  const summary = el("div", { className: "end-summary" }, [
    el("span", { className: "praise-emoji praise-emoji--sm", textContent: praise.emoji }),
    el("span", { className: "end-summary__praise", textContent: praise.text }),
    el("span", {
      className: "end-summary__stats",
      textContent: `${engine.wordCount}/${maxWords} mots · ${engine.score}/${maxScore} pts · ${pct}%`,
    }),
  ]);
  if (wordsToBeat != null) {
    const beaten = engine.wordCount > wordsToBeat;
    const tied = engine.wordCount === wordsToBeat;
    summary.append(
      el("span", {
        className: beaten ? "end-verdict end-verdict--win" : "end-verdict end-verdict--lose",
        textContent: beaten ? "Battu ! 🎉" : tied ? "Égalité" : `${wordsToBeat} à battre`,
      }),
    );
  }

  // Shared board for tracing a tapped word.
  const view = createBoardView(board);
  view.element.classList.add("grid-wrap--end");

  // Definition banner (fixed height; empty state until a word is tapped).
  const defWord = el("div", { className: "def__word" });
  const defText = el("div", {
    className: "def__text",
    textContent: "Touche un mot pour voir sa définition et son tracé.",
  });
  const defBanner = el("div", { className: "def def--empty" }, [defWord, defText]);

  let activeChip: HTMLElement | null = null;

  function showWord(word: string, chip: HTMLElement): void {
    if (activeChip) activeChip.classList.remove("chip--active");
    activeChip = chip;
    chip.classList.add("chip--active");

    const path = paths.get(word);
    if (path) view.drawPath(path);
    else view.clearPath();

    defBanner.classList.remove("def--empty");
    defWord.textContent = word.toUpperCase();
    defText.textContent = "…";
    definitions.then((lookup) => {
      if (activeChip !== chip) return; // a later tap won the race
      defText.textContent = lookup.get(word) ?? "Définition indisponible.";
    });
  }

  function chipList(words: string[]): HTMLElement {
    const list = el("div", { className: "chips" });
    for (const w of words) {
      const chip = el("button", { className: "chip", textContent: w.toUpperCase() });
      chip.addEventListener("click", () => showWord(w, chip));
      list.append(chip);
    }
    return list;
  }

  const foundList = chipList(found);
  const missedList = chipList(missed);
  missedList.style.display = "none";

  const tabFound = el("button", {
    className: "tab tab--active",
    textContent: `Trouvés (${found.length})`,
  });
  const tabMissed = el("button", { className: "tab", textContent: `Ratés (${missed.length})` });
  function selectTab(isFound: boolean): void {
    tabFound.classList.toggle("tab--active", isFound);
    tabMissed.classList.toggle("tab--active", !isFound);
    foundList.style.display = isFound ? "" : "none";
    missedList.style.display = isFound ? "none" : "";
  }
  tabFound.addEventListener("click", () => selectTab(true));
  tabMissed.addEventListener("click", () => selectTab(false));
  const tabs = el("div", { className: "tabs" }, [tabFound, tabMissed]);
  const chipsScroll = el("div", { className: "chips-scroll" }, [foundList, missedList]);

  // Actions (unchanged behavior).
  const shareBtn = el("button", {
    className: "btn btn--primary",
    textContent: "📤 Défier",
    onclick: async () => {
      try {
        const res = await shareChallenge({ board, wordsToBeat: engine.wordCount });
        if (res === "copied" || res === "manual") toast("Lien copié !");
      } catch {
        toast("Le partage a échoué");
      }
    },
  });
  const newGridBtn = el("button", { className: "btn", textContent: "🎲 Nouvelle", onclick: onNewGrid });
  const replaySameBtn = el("button", {
    className: "btn",
    textContent: "🔁 Rejouer",
    onclick: onReplaySame,
  });
  const actions = el("div", { className: "actions actions--end" }, [
    shareBtn,
    newGridBtn,
    replaySameBtn,
  ]);

  // Grid stays last (bottom of the screen), exactly where it sat during the
  // game, so the game→end transition doesn't move it. The definition banner
  // sits right under the word list; the actions live up top (out of the
  // list→grid flow). The chip list is the one flexible region that scrolls.
  root.append(
    el("div", { className: "screen screen--end" }, [
      summary,
      actions,
      tabs,
      chipsScroll,
      defBanner,
      view.element,
    ]),
  );
}
