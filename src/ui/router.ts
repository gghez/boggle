/**
 * A screen render thunk. It draws itself into the app root and may return a
 * teardown callback (to stop timers, drop listeners…) that the router runs when
 * the screen is left.
 */
export type View = () => void | (() => void);

/**
 * Minimal history-backed navigation stack.
 *
 * Screens are kept in an in-memory stack whose depth is mirrored into the
 * browser history via `pushState`/`popstate`. That single trick makes the
 * native back affordances — the edge-swipe gesture on mobile, the Android
 * hardware back button, the desktop back button — navigate between screens for
 * free, without the app owning any gesture code.
 *
 * The stack only ever grows or is edited at its top (`push`/`replace`), so a
 * history entry's stored index always points at a live stack slot; `popstate`
 * simply re-renders whatever screen that index names.
 */
export class Router {
  private stack: View[] = [];
  private index = -1;
  // Teardown for the currently displayed screen, if it returned one.
  private cleanup: void | (() => void) = undefined;
  // While set and returning false, back navigation off the current screen is
  // vetoed — used to keep an active game from being abandoned by an edge-swipe.
  private guard: (() => boolean) | null = null;

  constructor() {
    window.addEventListener('popstate', this.onPop);
  }

  private onPop = (e: PopStateEvent): void => {
    const i = (e.state as { i?: number } | null)?.i ?? 0;
    if (i < this.index && this.guard && !this.guard()) {
      // The current screen vetoes going back (an active game). Restore the
      // entry the browser just popped and stay put, without re-rendering.
      history.pushState({ i: this.index }, '');
      return;
    }
    // Clamp in case the browser kept back-entries from a previous page load
    // whose in-memory stack no longer exists (e.g. after a reload mid-game).
    this.index = Math.max(0, Math.min(i, this.stack.length - 1));
    this.show(this.stack[this.index]);
  };

  private show(view: View | undefined): void {
    if (this.cleanup) this.cleanup();
    this.cleanup = view?.();
  }

  /** Seed the stack with a single root screen. Called once, at startup. */
  reset(view: View): void {
    this.stack = [view];
    this.index = 0;
    history.replaceState({ i: 0 }, '');
    this.show(view);
  }

  /** Push a new screen; the back gesture returns to the current one. */
  push(view: View): void {
    this.stack = this.stack.slice(0, this.index + 1);
    this.stack.push(view);
    this.index = this.stack.length - 1;
    history.pushState({ i: this.index }, '');
    this.show(view);
  }

  /** Swap the current screen in place, adding no new back entry. */
  replace(view: View): void {
    this.stack[this.index] = view;
    history.replaceState({ i: this.index }, '');
    this.show(view);
  }

  /**
   * Install (or clear, with null) a veto on back navigation off the current
   * screen: while the guard returns false, a back gesture is absorbed and the
   * screen stays put. The screen that sets it must clear it in its teardown.
   */
  setGuard(guard: (() => boolean) | null): void {
    this.guard = guard;
  }

  /** Go back one screen (equivalent to the native back gesture/button). */
  back(): void {
    history.back();
  }

  /** Pop straight back to the root screen (index 0). */
  toRoot(): void {
    if (this.index > 0) history.go(-this.index);
    else this.show(this.stack[0]);
  }
}
