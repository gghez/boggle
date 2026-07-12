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
import { solveBoardWithPaths } from './game/solver';
import { renderEnd, type GameResult } from './ui/end';
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
      onReplay: (board, multipliers, scoreToBeat, seed) =>
        router.push(gameView(board, multipliers, scoreToBeat, seed)),
      // Re-view a past game's end screen: the found words are stored on the
      // record, and every findable word (with its path) is re-solved from the
      // board so the "Ratés" tab and word tracing work exactly as they did live.
      onView: (game, multipliers) => {
        if (!definitionsPromise) definitionsPromise = loadDefinitions();
        const result: GameResult = {
          score: game.score,
          wordCount: game.wordCount,
          foundWords: game.foundWords ?? [],
        };
        const stats: GameStats = {
          humanMaxWords: game.humanMaxWords,
          humanMaxScore: game.humanMaxScore,
          paths: solveBoardWithPaths(game.board, dict),
        };
        router.push(
          endView(result, game.board, multipliers, game.scoreToBeat, stats, game.seed ?? null),
        );
      },
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
    return gameView(generateBoard(seed), generateMultipliers(seed), null, seed);
  };

  // A finished game hands back to an end screen that *replaces* the game in
  // history: the game is over, so the back gesture should skip it and reach the
  // screen the game was launched from (home or history). New/replay games from
  // the end screen likewise replace it, keeping the stack shallow.
  const gameView =
    (
      board: Tile[],
      multipliers: MultiplierMap,
      scoreToBeat: number | null,
      seed: number | null,
    ): View =>
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
            foundWords: engine.foundWords,
            humanMaxScore: stats.humanMaxScore,
            humanMaxWords: stats.humanMaxWords,
            scoreToBeat,
            seed: seed ?? undefined,
          });
          router.replace(endView(engine, board, multipliers, scoreToBeat, stats, seed));
        },
        // Quitting mid-game (after the in-screen confirmation) abandons the run
        // without saving it: lift the back-gesture veto and pop to the screen the
        // game was launched from. The game's teardown then stops the countdown.
        onQuit: () => {
          router.setGuard(null);
          router.back();
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
      result: GameResult,
      board: Tile[],
      multipliers: MultiplierMap,
      scoreToBeat: number | null,
      stats: GameStats,
      seed: number | null,
    ): View =>
    () =>
      renderEnd(root, {
        engine: result,
        board,
        multipliers,
        scoreToBeat,
        seed,
        humanMaxScore: stats.humanMaxScore,
        paths: stats.paths,
        definitions: definitionsPromise!,
        onNewGrid: () => router.replace(freshGame()),
        onReplaySame: () => router.replace(gameView(board, multipliers, scoreToBeat, seed)),
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
    router.push(
      gameView(
        challenge.board,
        challenge.multipliers,
        challenge.scoreToBeat,
        challenge.seed ?? null,
      ),
    );
  }
}

void main();
