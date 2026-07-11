import { decodeChallenge } from './share/codec';
import {
  generateBoard,
  generateMultipliers,
  type Tile,
  type MultiplierMap,
} from './grid/generator';
import { loadDictionary, type Dictionary } from './dictionary';
import { loadDefinitions, type DefinitionLookup } from './dictionary/definitions';
import { renderHome } from './ui/home';
import { renderGame, type GameStats } from './ui/game';
import type { GameEngine } from './game/engine';
import { renderEnd } from './ui/end';
import { renderRules } from './ui/rules';
import { renderHistory } from './ui/history';
import { Router, type View } from './ui/router';
import { saveGame } from './history/store';
import { el, clear } from './ui/dom';
import './style.css';

function randomSeed(): number {
  return Math.floor(Math.random() * 2 ** 31);
}

// Definitions are downloaded once, lazily, in the background at first game start.
let definitionsPromise: Promise<DefinitionLookup> | null = null;

function renderLoading(root: HTMLElement): void {
  clear(root);
  root.append(
    el('div', { className: 'screen screen--loading' }, [
      el('div', { className: 'spinner' }),
      el('p', { textContent: 'Chargement du dictionnaire…' }),
    ]),
  );
}

async function main() {
  const root = document.querySelector<HTMLDivElement>('#app')!;
  renderLoading(root);

  let dict: Dictionary;
  try {
    dict = await loadDictionary();
  } catch {
    clear(root);
    root.append(
      el('div', { className: 'screen' }, [
        el('p', { textContent: 'Impossible de charger le dictionnaire.' }),
      ]),
    );
    return;
  }

  // Navigation runs through a tiny history-backed router: every screen is a
  // View thunk pushed onto a stack that mirrors the browser history, so the
  // native back gesture/button walks between screens. Each screen is defined as
  // a View (a `() => render(...)`) and handed to router.push/replace.
  // `trapRootBack` absorbs the back gesture on the home screen so it can't
  // close the app outright (there's nothing to go back to below home).
  const router = new Router({ trapRootBack: true });

  // Rules and history are always pushed on top, so their "← Retour" button and
  // the native back gesture both just pop back to whatever screen they sit on.
  const rulesView: View = () => renderRules(root, { onBack: () => router.back() });

  const historyView: View = () =>
    renderHistory(root, {
      onBack: () => router.back(),
      onReplay: (board, multipliers, scoreToBeat) =>
        router.push(gameView(board, multipliers, scoreToBeat)),
    });

  const homeView: View = () =>
    renderHome(
      root,
      () => router.push(freshGame()),
      () => router.push(rulesView),
      () => router.push(historyView),
    );

  // A brand-new grid: roll the board and its bonus tiles from one fresh seed, so
  // both the letters and the bonus layout are reproducible from that seed.
  const freshGame = (): View => {
    const seed = randomSeed();
    return gameView(generateBoard(seed), generateMultipliers(seed), null);
  };

  // A finished game hands back to an end screen that *replaces* the game in
  // history: the game is over, so the back gesture should skip it and reach the
  // screen the game was launched from (home or history). New/replay games from
  // the end screen likewise replace it, keeping the stack shallow.
  const gameView =
    (board: Tile[], multipliers: MultiplierMap, scoreToBeat: number | null): View =>
    () => {
      if (!definitionsPromise) definitionsPromise = loadDefinitions();
      const teardown = renderGame(root, {
        board,
        multipliers,
        dict,
        scoreToBeat,
        definitions: definitionsPromise,
        onEnd: (engine, stats) => {
          saveGame({
            board,
            multipliers,
            score: engine.score,
            wordCount: engine.wordCount,
            humanMaxScore: stats.humanMaxScore,
            humanMaxWords: stats.humanMaxWords,
            scoreToBeat,
          });
          router.replace(endView(engine, board, multipliers, scoreToBeat, stats));
        },
      });
      // A game runs to the buzzer: veto the back gesture so an edge-swipe (or a
      // stray word-tracing drag near the screen edge) can't abandon it. Lifted
      // in the teardown, which also fires when the timer ends → end screen.
      router.setGuard(() => false);
      return () => {
        router.setGuard(null);
        teardown();
      };
    };

  const endView =
    (
      engine: GameEngine,
      board: Tile[],
      multipliers: MultiplierMap,
      scoreToBeat: number | null,
      stats: GameStats,
    ): View =>
    () =>
      renderEnd(root, {
        engine,
        board,
        multipliers,
        scoreToBeat,
        humanMaxScore: stats.humanMaxScore,
        paths: stats.paths,
        definitions: definitionsPromise!,
        onNewGrid: () => router.replace(freshGame()),
        onReplaySame: () => router.replace(gameView(board, multipliers, scoreToBeat)),
        onHome: () => router.toRoot(),
        onHelp: () => router.push(rulesView),
      });

  const params = new URLSearchParams(location.search);
  const token = params.get('c');
  const challenge = token ? decodeChallenge(token) : null;

  // Home is always the stack root, so the back gesture and the end screen's
  // "🏠 Accueil" button reach it even when a challenge link opens straight
  // into a game.
  router.reset(homeView);
  if (challenge) {
    router.push(gameView(challenge.board, challenge.multipliers, challenge.scoreToBeat));
  }
}

void main();
