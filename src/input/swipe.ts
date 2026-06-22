import { areAdjacent } from "../game/rules";

/**
 * Compute the next path given the cell currently under the finger:
 * - empty path → start at cell
 * - same cell → unchanged
 * - cell already in the path → backtrack: cancel every letter after it
 *   (returning to letter N-1 from N drops N; also handles fast drags that
 *   jump back several letters at once)
 * - new cell not adjacent to the last → unchanged
 * - otherwise → append
 */
export function extendPath(path: number[], cell: number): number[] {
  if (path.length === 0) return [cell];
  const last = path[path.length - 1];
  if (cell === last) return path;
  const idx = path.indexOf(cell);
  if (idx !== -1) {
    // Finger went back onto an earlier letter: truncate to it.
    return path.slice(0, idx + 1);
  }
  if (!areAdjacent(last, cell)) return path;
  return [...path, cell];
}

/** Binds pointer events on the grid element to build and submit a swipe path. */
export class SwipeController {
  private path: number[] = [];
  private dragging = false;
  constructor(
    private root: HTMLElement,
    private onPath: (path: number[]) => void,
    private onSubmit: (path: number[]) => void,
  ) {
    root.addEventListener("pointerdown", this.down);
    root.addEventListener("pointermove", this.move);
    window.addEventListener("pointerup", this.up);
  }

  private cellFromEvent(e: PointerEvent): number | null {
    const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
    const idx = el?.dataset.cell;
    return idx == null ? null : Number(idx);
  }

  private down = (e: PointerEvent) => {
    const c = this.cellFromEvent(e);
    if (c == null) return;
    this.dragging = true;
    this.path = [c];
    this.onPath(this.path);
  };

  private move = (e: PointerEvent) => {
    if (!this.dragging) return;
    const c = this.cellFromEvent(e);
    if (c == null) return;
    const next = extendPath(this.path, c);
    if (next !== this.path) {
      this.path = next;
      this.onPath(this.path);
    }
  };

  private up = () => {
    if (!this.dragging) return;
    this.dragging = false;
    this.onSubmit(this.path);
    this.path = [];
    this.onPath(this.path);
  };

  destroy(): void {
    this.root.removeEventListener("pointerdown", this.down);
    this.root.removeEventListener("pointermove", this.move);
    window.removeEventListener("pointerup", this.up);
  }
}
