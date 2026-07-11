import { renderGame, TIMER_SECONDS, type GameOptions } from './game';
import { Dictionary } from '../dictionary';
import { DefinitionLookup } from '../dictionary/definitions';
import { generateBoard, generateMultipliers } from '../grid/generator';

function setup(overrides: Partial<GameOptions> = {}): {
  root: HTMLElement;
  teardown: () => void;
  ended: number;
  quit: number;
} {
  const root = document.createElement('div');
  const counters = { ended: 0, quit: 0 };
  const seed = 1;
  const teardown = renderGame(root, {
    board: generateBoard(seed),
    multipliers: generateMultipliers(seed),
    dict: new Dictionary([]),
    scoreToBeat: null,
    definitions: Promise.resolve(new DefinitionLookup(new Map())),
    onEnd: () => counters.ended++,
    onQuit: () => counters.quit++,
    ...overrides,
  });
  return {
    root,
    teardown,
    get ended() {
      return counters.ended;
    },
    get quit() {
      return counters.quit;
    },
  };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

test('the quit button opens a confirmation dialog', () => {
  const { root, teardown } = setup();
  expect(root.querySelector('.confirm')).toBeNull();
  (root.querySelector('.quit-btn') as HTMLElement).click();
  expect(root.querySelector('.confirm')).toBeTruthy();
  teardown();
});

test('cancelling the dialog dismisses it without quitting', () => {
  const s = setup();
  (s.root.querySelector('.quit-btn') as HTMLElement).click();
  const cancel = [...s.root.querySelectorAll('.confirm__actions .btn')].find(
    (b) => b.textContent === 'Reprendre',
  ) as HTMLElement;
  cancel.click();
  expect(s.root.querySelector('.confirm')).toBeNull();
  expect(s.quit).toBe(0);
  s.teardown();
});

test('confirming quit invokes onQuit', () => {
  const s = setup();
  (s.root.querySelector('.quit-btn') as HTMLElement).click();
  const confirm = [...s.root.querySelectorAll('.confirm__actions .btn')].find(
    (b) => b.textContent === 'Quitter',
  ) as HTMLElement;
  confirm.click();
  expect(s.quit).toBe(1);
  s.teardown();
});

test('the countdown keeps running while the confirmation dialog is open (no pause-to-cheat)', () => {
  const s = setup();
  (s.root.querySelector('.quit-btn') as HTMLElement).click();
  // Timer must keep ticking under the dialog: fast-forward past the full game
  // and the end handler still fires — the dialog never froze the clock.
  vi.advanceTimersByTime((TIMER_SECONDS + 1) * 1000);
  expect(s.ended).toBe(1);
  s.teardown();
});

test('opening the dialog does not stop the countdown display from decrementing', () => {
  const s = setup();
  const timerEl = s.root.querySelector('.timer') as HTMLElement;
  (s.root.querySelector('.quit-btn') as HTMLElement).click();
  vi.advanceTimersByTime(3000);
  // 3:00 → 2:57 after three ticks, proving the clock advanced behind the dialog.
  expect(timerEl.textContent).toBe('2:57');
  s.teardown();
});
