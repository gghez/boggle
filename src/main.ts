import { decodeChallenge } from "./share/codec";
import { generateBoard, type Tile } from "./grid/generator";
import { loadDictionary, type Dictionary } from "./dictionary";
import { loadDefinitions, type DefinitionLookup } from "./dictionary/definitions";
import { renderHome } from "./ui/home";
import { renderGame } from "./ui/game";
import { renderEnd } from "./ui/end";
import { renderRules } from "./ui/rules";
import { el, clear } from "./ui/dom";
import "./style.css";

function randomSeed(): number {
  return Math.floor(Math.random() * 2 ** 31);
}

// Definitions are downloaded once, lazily, in the background at first game start.
let definitionsPromise: Promise<DefinitionLookup> | null = null;

function renderLoading(root: HTMLElement): void {
  clear(root);
  root.append(
    el("div", { className: "screen screen--loading" }, [
      el("div", { className: "spinner" }),
      el("p", { textContent: "Chargement du dictionnaire…" }),
    ]),
  );
}

async function main() {
  const root = document.querySelector<HTMLDivElement>("#app")!;
  renderLoading(root);

  let dict: Dictionary;
  try {
    dict = await loadDictionary();
  } catch {
    clear(root);
    root.append(
      el("div", { className: "screen" }, [
        el("p", { textContent: "Impossible de charger le dictionnaire." }),
      ]),
    );
    return;
  }

  // Show the rules on a dedicated screen; the back button returns to `onBack`.
  const showRules = (onBack: () => void) => renderRules(root, { onBack });

  const showHome = () =>
    renderHome(
      root,
      () => startGame(generateBoard(randomSeed()), null),
      () => showRules(showHome),
    );

  const startGame = (board: Tile[], wordsToBeat: number | null) => {
    if (!definitionsPromise) definitionsPromise = loadDefinitions();
    renderGame(root, {
      board,
      dict,
      wordsToBeat,
      definitions: definitionsPromise!,
      onEnd: (engine, stats) => {
        const showEnd = () =>
          renderEnd(root, {
            engine,
            board,
            wordsToBeat,
            maxWords: stats.maxWords,
            maxScore: stats.maxScore,
            paths: stats.paths,
            definitions: definitionsPromise!,
            onNewGrid: () => startGame(generateBoard(randomSeed()), null),
            onReplaySame: () => startGame(board, wordsToBeat),
            onHelp: () => showRules(showEnd),
          });
        showEnd();
      },
    });
  };

  const params = new URLSearchParams(location.search);
  const token = params.get("c");
  const challenge = token ? decodeChallenge(token) : null;

  if (challenge) {
    startGame(challenge.board, challenge.wordsToBeat);
  } else {
    showHome();
  }
}

main();
