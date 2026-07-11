import { buildChallengeUrl } from './share';
import type { MultiplierMap } from '../grid/generator';

test('builds url with token param', () => {
  const url = buildChallengeUrl(
    {
      board: Array<string>(16).fill('A'),
      multipliers: new Array<null>(16).fill(null) as MultiplierMap,
      scoreToBeat: 5,
    },
    'https://x.app/',
  );
  expect(url.startsWith('https://x.app/?c=')).toBe(true);
});
