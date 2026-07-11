import { renderHome } from './home';

test('the help button invokes onHelp', () => {
  const root = document.createElement('div');
  let helped = 0;
  renderHome(
    root,
    () => {},
    () => helped++,
    () => {},
  );
  const help = root.querySelector('.help-btn') as HTMLElement;
  expect(help).toBeTruthy();
  help.click();
  expect(helped).toBe(1);
});

test('the primary button invokes onStart', () => {
  const root = document.createElement('div');
  let started = 0;
  renderHome(
    root,
    () => started++,
    () => {},
    () => {},
  );
  (root.querySelector('.btn--primary') as HTMLElement).click();
  expect(started).toBe(1);
});

test('the history button invokes onHistory', () => {
  const root = document.createElement('div');
  let visited = 0;
  renderHome(
    root,
    () => {},
    () => {},
    () => visited++,
  );
  const buttons = [...root.querySelectorAll('.btn')];
  const historyBtn = buttons.find((b) => b.textContent?.includes('Historique')) as HTMLElement;
  expect(historyBtn).toBeTruthy();
  historyBtn.click();
  expect(visited).toBe(1);
});
