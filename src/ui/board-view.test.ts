import { createBoardView } from './board-view';
import type { Tile, MultiplierMap } from '../grid/generator';

const board: Tile[] = ['A', 'B', 'C', ...Array<Tile>(13).fill('Z')];

test('createBoardView builds one cell per tile with its letter', () => {
  const view = createBoardView(board);
  expect(view.cells.length).toBe(16);
  expect(view.cells[0].textContent).toBe('A');
  expect(view.grid.querySelectorAll('.cell').length).toBe(16);
});

test('drawPath highlights the path cells and clearPath removes it', () => {
  const view = createBoardView(board);
  view.drawPath([0, 1, 2]);
  expect(view.cells[0].classList.contains('cell--active')).toBe(true);
  expect(view.cells[2].classList.contains('cell--active')).toBe(true);
  expect(view.cells[3].classList.contains('cell--active')).toBe(false);
  view.clearPath();
  expect(view.cells.some((c) => c.classList.contains('cell--active'))).toBe(false);
});

test('bonus tiles render a labelled badge; plain cells do not', () => {
  const multipliers: MultiplierMap = new Array<null>(16).fill(null);
  multipliers[0] = 'TL'; // letter bonus
  multipliers[1] = 'DW'; // word bonus
  const view = createBoardView(board, multipliers);
  expect(view.cells[0].querySelector('.cell__bonus--letter')!.textContent).toBe('L×3');
  expect(view.cells[1].querySelector('.cell__bonus--word')!.textContent).toBe('M×2');
  expect(view.cells[2].querySelector('.cell__bonus')).toBeNull();
});
