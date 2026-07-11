import { renderRules } from './rules';

test('renders the rules with a title and several sections', () => {
  const root = document.createElement('div');
  renderRules(root, { onBack: () => {} });
  expect(root.querySelector('.rules-title')!.textContent).toBe('Règles');
  expect(root.querySelectorAll('.rules-section').length).toBeGreaterThanOrEqual(5);
  // The no-proper-noun rule is stated on the page.
  expect(root.textContent).toContain('noms propres');
});

test('the back button invokes onBack', () => {
  const root = document.createElement('div');
  let backed = 0;
  renderRules(root, { onBack: () => backed++ });
  (root.querySelector('.rules-back') as HTMLElement).click();
  expect(backed).toBe(1);
});
