import { decodeChallenge } from "./share/codec";
import { generateBoard, type Tile } from "./grid/generator";
import { loadDictionary, type Dictionary } from "./dictionary";
import { renderHome } from "./ui/home";
import { renderGame } from "./ui/game";
import { renderEnd } from "./ui/end";
import { el, clear } from "./ui/dom";
import "./style.css";

function randomSeed(): number {
  return Math.floor(Math.random() * 2 ** 31);
}

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

  const startGame = (board: Tile[], wordsToBeat: number | null) => {
    renderGame(root, {
      board,
      dict,
      wordsToBeat,
      onEnd: (engine, stats) =>
        renderEnd(root, {
          engine,
          board,
          wordsToBeat,
          maxWords: stats.maxWords,
          maxScore: stats.maxScore,
          onReplay: () => startGame(generateBoard(randomSeed()), null),
        }),
    });
  };

  const params = new URLSearchParams(location.search);
  const token = params.get("c");
  const challenge = token ? decodeChallenge(token) : null;

  if (challenge) {
    startGame(challenge.board, challenge.wordsToBeat);
  } else {
    renderHome(root, () => startGame(generateBoard(randomSeed()), null));
  }
}

main();
