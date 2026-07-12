import { isSoundEnabled, setSoundEnabled } from './settings';

beforeEach(() => localStorage.clear());

describe('sound settings', () => {
  test('defaults to enabled when nothing is stored', () => {
    expect(isSoundEnabled()).toBe(true);
  });

  test('persists a disabled preference', () => {
    setSoundEnabled(false);
    expect(isSoundEnabled()).toBe(false);
    expect(localStorage.getItem('boggle:sound')).toBe('off');
  });

  test('persists re-enabling', () => {
    setSoundEnabled(false);
    setSoundEnabled(true);
    expect(isSoundEnabled()).toBe(true);
    expect(localStorage.getItem('boggle:sound')).toBe('on');
  });
});
