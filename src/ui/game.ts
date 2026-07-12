import type { Tile, MultiplierMap } from '../grid/generator';
import type { Dictionary } from '../dictionary';
import type { DefinitionLookup } from '../dictionary/definitions';
import { GameEngine, type SubmitResult } from '../game/engine';
import { Countdown } from '../game/timer';
import { SwipeController } from '../input/swipe';
import { pathToWord, scorePath, humanReach } from '../game/rules';
import { solveBoardWithPaths } from '../game/solver';
import { el, clear } from './dom';
import { createBoardView } from './board-view';
import { createSoundPlayer } from '../audio/sounds';
import { isSoundEnabled, setSoundEnabled } from '../audio/settings';

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
  multipliers: MultiplierMap;
  dict: Dictionary;
  /** Opponent's score to beat in a challenge, null for a plain game. */
  scoreToBeat: number | null;
  definitions: Promise<DefinitionLookup>;
  onEnd: (engine: GameEngine, stats: GameStats) => void;
  /**
   * Abandon the current game (the "← quit" button, after confirmation). The
   * countdown keeps running until this fires, so opening the dialog can't be
   * used to pause the clock and think up words before cancelling.
   */
  onQuit: () => void;
}

/**
 * Render the playable game screen and wire up swipe input + countdown. Returns
 * a teardown that stops the countdown and unbinds swipe input — the router runs
 * it when the screen is left (e.g. the player uses the back gesture mid-game),
 * so a backgrounded game can't keep ticking and fire its end handler.
 */
export function renderGame(root: HTMLElement, opts: GameOptions): () => void {
  const { board, multipliers, dict, scoreToBeat, definitions, onEnd, onQuit } = opts;
  clear(root);
  // Definitions load in the background during play; once ready, a found word's
  // gloss is flashed above the grid. Null until the asset resolves.
  let defLookup: DefinitionLookup | null = null;
  void definitions.then((l) => {
    defLookup = l;
  });
  const engine = new GameEngine(board, multipliers, dict);

  // Every word findable on this board, with a path for re-tracing on the end screen.
  const paths = solveBoardWithPaths(board, dict);
  // The end-screen rating chases a reachable target: what a human could enter in
  // the time limit, scored on each word's found path (bonus tiles included), not
  // the theoretical total of obscure words no one could reach in time (humanReach).
  const wordScores = [...paths.values()].map((path) => scorePath(board, multipliers, path));
  const reach = humanReach(wordScores, TIMER_SECONDS);

  const timerEl = el('div', { className: 'timer', textContent: formatTime(TIMER_SECONDS) });
  const scoreEl = el('div', { className: 'score', textContent: '0 pts' });
  const currentEl = el('div', { className: 'current' });
  const wordsEl = el('ul', { className: 'words' });

  // In a challenge, a score-based progress bar tracks the run toward the score to
  // beat; it turns green once passed. Plain games show no bar (only the score).
  const progressFill = el('div', { className: 'progress__fill' });
  const progressBar = el('div', { className: 'progress__bar' }, [progressFill]);
  const progressLabel = el('div', {
    className: 'progress__label',
    textContent: scoreToBeat != null ? `Score à battre : ${scoreToBeat}` : '',
  });
  const progressEl =
    scoreToBeat != null ? el('div', { className: 'progress' }, [progressBar, progressLabel]) : null;

  function updateProgress(): void {
    if (scoreToBeat == null) return;
    const pct = scoreToBeat > 0 ? Math.min(100, (engine.score / scoreToBeat) * 100) : 100;
    progressFill.style.width = `${pct}%`;
    progressFill.classList.toggle('progress__fill--ahead', engine.score > scoreToBeat);
  }
  updateProgress();

  // Shared 4x4 grid + SVG path overlay (bonus tiles shown).
  const view = createBoardView(board, multipliers);
  const cells = view.cells;
  const gridEl = view.grid;
  const gridWrap = view.element;

  const sound = createSoundPlayer();
  // Track the previous path length so a tick fires only when a letter is added
  // (not on backtrack or when the path clears), rising in pitch with the length.
  let prevPathLength = 0;

  function drawPath(path: number[]): void {
    view.drawPath(path);
    currentEl.textContent = path.length ? pathToWord(board, path).toUpperCase() : '';
    if (path.length > prevPathLength) sound.tick(path.length);
    prevPathLength = path.length;
  }

  // Floating "WORD +N" popup above the grid; +N colored by a point tier (scores
  // are now open-ended, so we bucket by magnitude rather than exact value).
  function gainTier(points: number): number {
    if (points >= 40) return 5;
    if (points >= 20) return 4;
    if (points >= 10) return 3;
    if (points >= 5) return 2;
    return 1;
  }
  function showGain(word: string, points: number): void {
    const gain = el('div', { className: 'gain' }, [
      el('span', { className: 'gain__word', textContent: word.toUpperCase() }),
      el('span', {
        className: `gain__pts gain__pts--t${gainTier(points)}`,
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
      // Result cue on release: win for a new word, a neutral blip for a
      // duplicate, a lose buzz otherwise. A 1-cell tap (an accidental tap
      // rather than a real trace) stays silent.
      if (result === 'valid-new') sound.win();
      else if (result === 'valid-duplicate') sound.duplicate();
      else if (path.length >= 2) sound.lose();
      if (result === 'valid-new') {
        const word = pathToWord(board, path);
        showGain(word, scorePath(board, multipliers, path));
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

  // "← Quitter" button: abandon the game, but only after confirming. The
  // confirmation dialog deliberately leaves the countdown running (see below).
  const quitBtn = el('button', {
    className: 'btn quit-btn',
    textContent: '←',
    title: 'Quitter la partie',
    ariaLabel: 'Quitter la partie',
    onclick: () => openQuitDialog(),
  });

  // Sound on/off toggle: a round icon button that mirrors its persisted state.
  // The icon (🔊 / 🔇) swaps with the state so the current mode is always visible.
  const soundBtn = el('button', { className: 'btn sound-btn' });
  function refreshSoundBtn(): void {
    const on = isSoundEnabled();
    soundBtn.textContent = on ? '🔊' : '🔇';
    const label = on ? 'Couper le son' : 'Activer le son';
    soundBtn.title = label;
    soundBtn.ariaLabel = label;
    soundBtn.setAttribute('aria-pressed', String(!on));
  }
  soundBtn.onclick = () => {
    const next = !isSoundEnabled();
    setSoundEnabled(next);
    refreshSoundBtn();
    // Play a confirmation blip when turning sound back on, so the toggle is audible.
    if (next) sound.tick(1);
  };
  refreshSoundBtn();

  // Only ever one dialog at a time.
  let quitDialog: HTMLElement | null = null;
  function closeQuitDialog(): void {
    if (!quitDialog) return;
    quitDialog.remove();
    quitDialog = null;
  }
  function openQuitDialog(): void {
    if (quitDialog) return;
    // The clock is NOT stopped here: pausing while the dialog is open would let a
    // player freeze time, find words, then cancel — so the timer keeps ticking
    // underneath and only leaving the game (confirm) tears it down.
    quitDialog = el('div', { className: 'confirm' }, [
      el('div', { className: 'confirm__box' }, [
        el('p', { className: 'confirm__title', textContent: 'Quitter la partie ?' }),
        el('p', {
          className: 'confirm__text',
          textContent: 'Le chrono continue de tourner. La partie en cours sera perdue.',
        }),
        el('div', { className: 'confirm__actions' }, [
          el('button', {
            className: 'btn',
            textContent: 'Reprendre',
            onclick: () => closeQuitDialog(),
          }),
          el('button', {
            className: 'btn btn--danger',
            textContent: 'Quitter',
            onclick: () => onQuit(),
          }),
        ]),
      ]),
    ]);
    screen.append(quitDialog);
  }

  const headerLeft = el('div', { className: 'game-header__left' }, [quitBtn, soundBtn]);
  const header = el('div', { className: 'game-header' }, [headerLeft, timerEl, scoreEl]);
  // Grid sits at the bottom (thumb reach); info fills the space above it.
  // .board-area bounds the grid to the available height so it never overflows
  // the viewport (which would introduce a page scroll).
  const screen = el('div', { className: 'screen screen--game' }, [
    header,
    ...(progressEl ? [progressEl] : []),
    el('div', { className: 'words-wrap words-wrap--grow' }, [wordsEl]),
    currentEl,
    el('div', { className: 'board-area' }, [gridWrap]),
  ]);
  root.append(screen);

  return destroy;
}
