import type { Tile } from '../grid/generator';
import type { Dictionary } from '../dictionary';
import type { DefinitionLookup } from '../dictionary/definitions';
import { GameEngine, type SubmitResult } from '../game/engine';
import { Countdown } from '../game/timer';
import { SwipeController } from '../input/swipe';
import { pathToWord, scoreWord, humanReach } from '../game/rules';
import { solveBoardWithPaths } from '../game/solver';
import { el, clear } from './dom';
import { createBoardView } from './board-view';

export const TIMER_SECONDS = 180;

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export interface GameStats {
  humanMaxWords: number;
  humanMaxScore: number;
  paths: Map<string, number[]>;
}

export interface GameOptions {
  board: Tile[];
  dict: Dictionary;
  wordsToBeat: number | null;
  definitions: Promise<DefinitionLookup>;
  onEnd: (engine: GameEngine, stats: GameStats) => void;
}

/**
 * Render the playable game screen and wire up swipe input + countdown. Returns
 * a teardown that stops the countdown and unbinds swipe input — the router runs
 * it when the screen is left (e.g. the player uses the back gesture mid-game),
 * so a backgrounded game can't keep ticking and fire its end handler.
 */
export function renderGame(root: HTMLElement, opts: GameOptions): () => void {
  const { board, dict, wordsToBeat, definitions, onEnd } = opts;
  clear(root);
  // Definitions load in the background during play; once ready, a found word's
  // gloss is flashed above the grid. Null until the asset resolves.
  let defLookup: DefinitionLookup | null = null;
  void definitions.then((l) => {
    defLookup = l;
  });
  const engine = new GameEngine(board, dict);

  // Every word findable on this board, with a path for re-tracing on the end screen.
  const paths = solveBoardWithPaths(board, dict);
  const allWords = [...paths.keys()];
  // The in-game progress and the end screen both chase the same reachable target:
  // what a human could enter in the time limit, not the theoretical total that
  // includes obscure words no one could reach in time (see humanReach).
  const reach = humanReach(allWords.map(scoreWord), TIMER_SECONDS);
  const goal = reach.words;

  const timerEl = el('div', { className: 'timer', textContent: formatTime(TIMER_SECONDS) });
  const scoreEl = el('div', { className: 'score', textContent: '0 pts' });
  const beatEl =
    wordsToBeat != null
      ? el('div', { className: 'beat', textContent: `${wordsToBeat} mots à battre` })
      : el('div', { className: 'beat' });
  const currentEl = el('div', { className: 'current' });
  const wordsEl = el('ul', { className: 'words' });

  // Progress bar: found / reachable goal, with the friend's score marked in challenge mode.
  const progressFill = el('div', { className: 'progress__fill' });
  const progressMarker = el('div', { className: 'progress__marker' });
  if (wordsToBeat != null && goal > 0) {
    const pct = Math.min(100, (wordsToBeat / goal) * 100);
    progressMarker.style.left = `${pct}%`;
    progressMarker.title = `Score de l'ami : ${wordsToBeat}`;
  } else {
    progressMarker.style.display = 'none';
  }
  const progressBar = el('div', { className: 'progress__bar' }, [progressFill, progressMarker]);
  const progressLabel = el('div', {
    className: 'progress__label',
    textContent: `0 / ${goal} mots`,
  });
  const progressEl = el('div', { className: 'progress' }, [progressBar, progressLabel]);

  function updateProgress(): void {
    const found = engine.wordCount;
    const pct = goal > 0 ? Math.min(100, (found / goal) * 100) : 0;
    progressFill.style.width = `${pct}%`;
    progressLabel.textContent = `${found} / ${goal} mots`;
    if (wordsToBeat != null) {
      progressFill.classList.toggle('progress__fill--ahead', found > wordsToBeat);
    }
  }
  updateProgress();

  // Shared 4x4 grid + SVG path overlay.
  const view = createBoardView(board);
  const cells = view.cells;
  const gridEl = view.grid;
  const gridWrap = view.element;

  function drawPath(path: number[]): void {
    view.drawPath(path);
    currentEl.textContent = path.length ? pathToWord(board, path).toUpperCase() : '';
  }

  // Floating "WORD +N" popup above the grid; +N colored by its point value.
  function showGain(word: string, points: number): void {
    const gain = el('div', { className: 'gain' }, [
      el('span', { className: 'gain__word', textContent: word.toUpperCase() }),
      el('span', {
        className: `gain__pts gain__pts--p${points}`,
        textContent: `+${points}`,
      }),
    ]);
    gridWrap.append(gain);
    gain.addEventListener('animationend', () => gain.remove());
  }

  // Flash a found word's definition above the grid for ~3s (one at a time).
  let currentDef: HTMLElement | null = null;
  function showDefinition(word: string, gloss: string): void {
    if (currentDef) currentDef.remove();
    const def = el('div', { className: 'game-def' }, [
      el('span', { className: 'game-def__word', textContent: word.toUpperCase() }),
      el('span', { className: 'game-def__text', textContent: gloss }),
    ]);
    currentDef = def;
    gridWrap.append(def);
    def.addEventListener('animationend', () => {
      def.remove();
      if (currentDef === def) currentDef = null;
    });
  }

  function flash(result: SubmitResult): void {
    const cls =
      result === 'valid-new'
        ? 'flash--new'
        : result === 'valid-duplicate'
          ? 'flash--dup'
          : 'flash--bad';
    const active = cells.filter((c) => c.classList.contains('cell--active'));
    for (const c of active) {
      c.classList.add(cls);
      setTimeout(() => c.classList.remove(cls), 350);
    }
  }

  function updateWords(): void {
    scoreEl.textContent = `${engine.score} pts`;
    updateProgress();
    clear(wordsEl);
    for (const w of engine.foundWords.slice().reverse()) {
      wordsEl.append(el('li', { textContent: w.toUpperCase() }));
    }
  }

  const swipe = new SwipeController(
    gridEl,
    (path) => drawPath(path),
    (path) => {
      const result = engine.submitPath(path);
      flash(result);
      if (result === 'valid-new') {
        const word = pathToWord(board, path);
        showGain(word, scoreWord(word));
        const gloss = defLookup?.get(word);
        if (gloss) showDefinition(word, gloss);
        updateWords();
      }
    },
  );

  const countdown = new Countdown(
    TIMER_SECONDS,
    (remaining) => {
      timerEl.textContent = formatTime(remaining);
      if (remaining <= 10) timerEl.classList.add('timer--low');
    },
    () => {
      swipe.destroy();
      onEnd(engine, { humanMaxWords: reach.words, humanMaxScore: reach.score, paths });
    },
  );
  countdown.start();

  // Teardown so leaving the screen (back gesture) can't leave a live timer or
  // dangling window listener behind. Both calls are idempotent.
  const destroy = () => {
    countdown.stop();
    swipe.destroy();
  };

  const header = el('div', { className: 'game-header' }, [timerEl, scoreEl, beatEl]);
  // Grid sits at the bottom (thumb reach); info fills the space above it.
  // .board-area bounds the grid to the available height so it never overflows
  // the viewport (which would introduce a page scroll).
  const screen = el('div', { className: 'screen screen--game' }, [
    header,
    progressEl,
    el('div', { className: 'words-wrap words-wrap--grow' }, [wordsEl]),
    currentEl,
    el('div', { className: 'board-area' }, [gridWrap]),
  ]);
  root.append(screen);

  return destroy;
}
