import { afterEach, expect, test, vi } from 'vitest';
import { Router, type View } from './router';

// Each screen writes its label into `root` so we can assert what's shown, and
// optionally returns a cleanup spy so we can assert teardown on leaving.
function view(root: HTMLElement, label: string, cleanup?: () => void): View {
  return () => {
    root.replaceChildren(document.createTextNode(label));
    return cleanup;
  };
}

function pop(index: number): void {
  window.dispatchEvent(new PopStateEvent('popstate', { state: { i: index } }));
}

afterEach(() => {
  history.replaceState(null, '');
});

test('reset renders the root screen at history index 0', () => {
  const root = document.createElement('div');
  const router = new Router();
  router.reset(view(root, 'home'));
  expect(root.textContent).toBe('home');
  expect((history.state as { i: number }).i).toBe(0);
});

test('push shows the new screen and bumps the history index', () => {
  const root = document.createElement('div');
  const router = new Router();
  router.reset(view(root, 'home'));
  router.push(view(root, 'rules'));
  expect(root.textContent).toBe('rules');
  expect((history.state as { i: number }).i).toBe(1);
});

test('a back navigation re-renders the previous screen', () => {
  const root = document.createElement('div');
  const router = new Router();
  router.reset(view(root, 'home'));
  router.push(view(root, 'history'));
  expect(root.textContent).toBe('history');
  pop(0); // native back gesture
  expect(root.textContent).toBe('home');
});

test('replace swaps the current screen without adding a back entry', () => {
  const root = document.createElement('div');
  const router = new Router();
  router.reset(view(root, 'home'));
  router.push(view(root, 'game'));
  router.replace(view(root, 'end'));
  expect(root.textContent).toBe('end');
  expect((history.state as { i: number }).i).toBe(1);
  // Backing out reaches home, skipping the replaced game screen.
  pop(0);
  expect(root.textContent).toBe('home');
});

test('leaving a screen runs its cleanup', () => {
  const root = document.createElement('div');
  const cleanup = vi.fn();
  const router = new Router();
  router.reset(view(root, 'home'));
  router.push(view(root, 'game', cleanup));
  expect(cleanup).not.toHaveBeenCalled();
  router.replace(view(root, 'end'));
  expect(cleanup).toHaveBeenCalledTimes(1);
});

test('a guard vetoes back navigation until it is cleared', () => {
  const root = document.createElement('div');
  const router = new Router();
  router.reset(view(root, 'home'));
  router.push(view(root, 'game'));
  router.setGuard(() => false); // active game blocks leaving
  pop(0); // back gesture
  expect(root.textContent).toBe('game'); // absorbed — stayed on the game
  router.setGuard(null); // game over
  pop(0);
  expect(root.textContent).toBe('home');
});

test('toRoot pops all the way back to index 0', () => {
  const root = document.createElement('div');
  const router = new Router();
  router.reset(view(root, 'home'));
  router.push(view(root, 'game'));
  router.replace(view(root, 'end'));
  const go = vi.spyOn(history, 'go');
  router.toRoot();
  expect(go).toHaveBeenCalledWith(-1);
  go.mockRestore();
});

test('popstate into a stale, deeper index is clamped to a live screen', () => {
  const root = document.createElement('div');
  const router = new Router();
  router.reset(view(root, 'home'));
  // A stray entry from a previous page load points past the current stack.
  pop(5);
  expect(root.textContent).toBe('home');
});
