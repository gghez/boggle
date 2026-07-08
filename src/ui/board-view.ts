import type { Tile } from "../grid/generator";
import { el } from "./dom";

export interface BoardView {
  /** Root element (grid + path overlay) to insert into the DOM. */
  element: HTMLElement;
  /** Cell elements indexed 0..n-1 (for input wiring / flashing). */
  cells: HTMLElement[];
  /** Inner grid element (swipe input target). */
  grid: HTMLElement;
  /** Draw the polyline through the given cell path, highlighting those cells. */
  drawPath(path: number[]): void;
  /** Clear the current path (removes highlight + line). */
  clearPath(): void;
}

/** Build a Boggle board view: 4x4 letter grid + SVG path overlay. */
export function createBoardView(board: Tile[]): BoardView {
  const cells: HTMLElement[] = [];
  const grid = el("div", { className: "grid" });
  board.forEach((tile, i) => {
    const cell = el("div", { className: "cell" }, [
      el("span", { className: "cell__letter", textContent: tile }),
    ]);
    cell.dataset.cell = String(i);
    cells.push(cell);
    grid.append(cell);
  });

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.classList.add("path-overlay");
  const poly = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
  poly.classList.add("path-line");
  svg.append(poly);

  const element = el("div", { className: "grid-wrap" }, [grid, svg]);

  function drawPath(path: number[]): void {
    for (const c of cells) c.classList.remove("cell--active");
    if (path.length === 0) {
      poly.setAttribute("points", "");
      return;
    }
    const wrapRect = element.getBoundingClientRect();
    const points: string[] = [];
    for (const i of path) {
      cells[i].classList.add("cell--active");
      const r = cells[i].getBoundingClientRect();
      const x = r.left - wrapRect.left + r.width / 2;
      const y = r.top - wrapRect.top + r.height / 2;
      points.push(`${x},${y}`);
    }
    poly.setAttribute("points", points.join(" "));
  }

  function clearPath(): void {
    drawPath([]);
  }

  return { element, cells, grid, drawPath, clearPath };
}
