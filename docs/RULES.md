# Rules

French Boggle: find as many words as possible in 3 minutes on a 4×4 grid of
lettered dice.

## The grid

- A 4×4 grid of 16 tiles. Each tile shows one letter, except the **"Qu"** tile,
  which is a single tile counting as the two letters **q + u**.
- Every player of the same grid (including a shared challenge) sees the exact
  same board.

## Forming a word

- A word is a path across the grid: start on any tile, then move to an
  **adjacent** tile — horizontally, vertically, or diagonally (8 directions).
- A tile **cannot be reused** within the same word.
- A word must be at least **3 letters** long (the "Qu" tile contributes 2).

## Eligible words

Only valid French dictionary words count. In particular:

- **No proper nouns** — names of people (including surnames), places, or
  brands. `Dupont`, `Paris`, `Zidane` are not accepted.
- **No abbreviations or acronyms.**
- **No hyphenated words** and **no words that need an apostrophe.**

Matching is **accent- and case-insensitive** (`é` = `e`, `ç` = `c`): the
dictionary is normalized to lowercase `a`–`z`, so accents and capitals never
affect whether a word is accepted.

The no-proper-noun rule is enforced when the dictionary asset is built: proper
nouns are filtered out of the word list (see below).

## Scoring

Points are awarded by word length:

| Length   | Points |
| -------- | ------ |
| 3–4      | 1      |
| 5        | 2      |
| 6        | 3      |
| 7        | 5      |
| 8 and up | 11     |

## Challenge a friend

The whole grid and your score-to-beat are encoded into a share URL. Whoever
opens it plays the **same grid** and sees how many words they have to beat — no
backend, the challenge lives entirely in the link.

## Board generation (algorithm)

The board is generated deterministically from a single integer **seed**, so the
same seed always produces the same grid (this is what makes a shared challenge
reproducible for both players).

1. **Dice.** There are 16 fixed, standard French Boggle dice. Each die has 6
   faces; a face is a single uppercase letter or the `"Qu"` digraph.
2. **PRNG.** A deterministic pseudo-random generator, `mulberry32(seed)`, yields
   the randomness — same seed, same sequence.
3. **Shuffle.** The 16 dice are shuffled into grid positions with a Fisher–Yates
   shuffle driven by the PRNG.
4. **Roll.** Each die in its position shows one randomly chosen face (`rng() * 6`).
   The 16 chosen faces, in row-major order, are the board.

**Seed source:**

- A **new game** uses a random 31-bit seed.
- A **challenge or replay** decodes the board (hence its seed) from the share
  URL token, so generation is reproducible and both players get an identical
  grid.
