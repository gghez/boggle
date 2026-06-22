import type { Tile } from "../grid/generator";
import type { Dictionary } from "../dictionary";
import { GameEngine, type SubmitResult } from "../game/engine";
import { Countdown } from "../game/timer";
import { SwipeController } from "../input/swipe";
import { pathToWord } from "../game/rules";
import { el, clear } from "./dom";

export const TIMER_SECONDS = 180;

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export interface GameOptions {
  board: Tile[];
  dict: Dictionary;
  wordsToBeat: number | null;
  onEnd: (engine: GameEngine) => void;
}

/** Render the playable game screen and wire up swipe input + countdown. */
export function renderGame(root: HTMLElement, opts: GameOptions): void {
  const { board, dict, wordsToBeat, onEnd } = opts;
  clear(root);
  const engine = new GameEngine(board, dict);

  const timerEl = el("div", { className: "timer", textContent: formatTime(TIMER_SECONDS) });
  const scoreEl = el("div", { className: "score", textContent: "0 pts" });
  const beatEl =
    wordsToBeat != null
      ? el("div", { className: "beat", textContent: `${wordsToBeat} mots à battre` })
      : el("div", { className: "beat" });
  const currentEl = el("div", { className: "current" });
  const wordsEl = el("ul", { className: "words" });

  // Build the 4x4 grid.
  const cells: HTMLElement[] = [];
  const gridEl = el("div", { className: "grid" });
  board.forEach((tile, i) => {
    const cell = el("div", { className: "cell" }, [
      el("span", { className: "cell__letter", textContent: tile }),
    ]);
    cell.dataset.cell = String(i);
    cells.push(cell);
    gridEl.append(cell);
  });

  // SVG overlay for the swipe path line.
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.classList.add("path-overlay");
  const poly = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
  poly.classList.add("path-line");
  svg.append(poly);

  const gridWrap = el("div", { className: "grid-wrap" }, [gridEl, svg]);

  function drawPath(path: number[]): void {
    for (const c of cells) c.classList.remove("cell--active");
    if (path.length === 0) {
      poly.setAttribute("points", "");
      currentEl.textContent = "";
      return;
    }
    const wrapRect = gridWrap.getBoundingClientRect();
    const points: string[] = [];
    for (const i of path) {
      cells[i].classList.add("cell--active");
      const r = cells[i].getBoundingClientRect();
      const x = r.left - wrapRect.left + r.width / 2;
      const y = r.top - wrapRect.top + r.height / 2;
      points.push(`${x},${y}`);
    }
    poly.setAttribute("points", points.join(" "));
    currentEl.textContent = pathToWord(board, path).toUpperCase();
  }

  function flash(result: SubmitResult): void {
    const cls =
      result === "valid-new"
        ? "flash--new"
        : result === "valid-duplicate"
          ? "flash--dup"
          : "flash--bad";
    const active = cells.filter((c) => c.classList.contains("cell--active"));
    for (const c of active) {
      c.classList.add(cls);
      setTimeout(() => c.classList.remove(cls), 350);
    }
  }

  function updateWords(): void {
    scoreEl.textContent = `${engine.score} pts`;
    clear(wordsEl);
    for (const w of engine.foundWords.slice().reverse()) {
      wordsEl.append(el("li", { textContent: w.toUpperCase() }));
    }
  }

  const swipe = new SwipeController(
    gridEl,
    (path) => drawPath(path),
    (path) => {
      const result = engine.submitPath(path);
      flash(result);
      if (result === "valid-new") updateWords();
    },
  );

  const countdown = new Countdown(
    TIMER_SECONDS,
    (remaining) => {
      timerEl.textContent = formatTime(remaining);
      if (remaining <= 10) timerEl.classList.add("timer--low");
    },
    () => {
      swipe.destroy();
      onEnd(engine);
    },
  );
  countdown.start();

  const header = el("div", { className: "game-header" }, [timerEl, scoreEl, beatEl]);
  const screen = el("div", { className: "screen screen--game" }, [
    header,
    gridWrap,
    currentEl,
    el("div", { className: "words-wrap" }, [wordsEl]),
  ]);
  root.append(screen);
}
