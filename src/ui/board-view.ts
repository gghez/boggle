import type { Tile, Multiplier, MultiplierMap } from '../grid/generator';
import { el } from './dom';

/** Short label shown on a bonus tile (L = lettre, M = mot). */
const BONUS_LABEL: Record<Multiplier, string> = {
  DL: 'L×2',
  TL: 'L×3',
  DW: 'M×2',
  TW: 'M×3',
};

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
export function createBoardView(board: Tile[], multipliers?: MultiplierMap): BoardView {
  const cells: HTMLElement[] = [];
  const grid = el('div', { className: 'grid' });
  board.forEach((tile, i) => {
    const children: (Node | string)[] = [
      el('span', { className: 'cell__letter', textContent: tile }),
    ];
    const bonus = multipliers?.[i] ?? null;
    if (bonus) {
      const isLetter = bonus === 'DL' || bonus === 'TL';
      children.push(
        el('span', {
          className: `cell__bonus cell__bonus--${isLetter ? 'letter' : 'word'}`,
          textContent: BONUS_LABEL[bonus],
        }),
      );
    }
    const cell = el('div', { className: bonus ? 'cell cell--bonus' : 'cell' }, children);
    cell.dataset.cell = String(i);
    cells.push(cell);
    grid.append(cell);
  });

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('path-overlay');
  const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
  poly.classList.add('path-line');
  svg.append(poly);

  const element = el('div', { className: 'grid-wrap' }, [grid, svg]);

  function drawPath(path: number[]): void {
    for (const c of cells) c.classList.remove('cell--active');
    if (path.length === 0) {
      poly.setAttribute('points', '');
      return;
    }
    const wrapRect = element.getBoundingClientRect();
    const points: string[] = [];
    for (const i of path) {
      cells[i].classList.add('cell--active');
      const r = cells[i].getBoundingClientRect();
      const x = r.left - wrapRect.left + r.width / 2;
      const y = r.top - wrapRect.top + r.height / 2;
      points.push(`${x},${y}`);
    }
    poly.setAttribute('points', points.join(' '));
  }

  function clearPath(): void {
    drawPath([]);
  }

  return { element, cells, grid, drawPath, clearPath };
}
