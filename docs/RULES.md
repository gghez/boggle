# Rules

French Boggle: find as many words as possible in 3 minutes on a 4×4 grid of
lettered dice.

## The grid

- A 4×4 grid of 16 tiles. Each tile shows one letter, except the **"Qu"** tile,
  which is a single tile counting as the two letters **q + u**.
- Four tiles carry a **Ruzzle-style bonus**: **L×2 / L×3** multiply that
  letter's value, **M×2 / M×3** multiply the whole word's score.
- Every player of the same grid (including a shared challenge) sees the exact
  same board **and the same bonus tiles**.

## Forming a word

- A word is a path across the grid: start on any tile, then move to an
  **adjacent** tile — horizontally, vertically, or diagonally (8 directions).
- A tile **cannot be reused** within the same word.
- A word must be at least **3 letters** long (the "Qu" tile contributes 2).

## Eligible words

Only words from the **ODS8** (Officiel du jeu Scrabble, 8th edition) — the
official reference dictionary for competitive French Scrabble — count. In
particular:

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

Each letter has a value, following the French Scrabble tiles:

| Letters                      | Value |
| ---------------------------- | ----- |
| E, A, I, N, O, R, S, T, U, L | 1     |
| D, G, M                      | 2     |
| B, C, P                      | 3     |
| F, H, V                      | 4     |
| J, Q                         | 8     |
| K, W, X, Y, Z                | 10    |
| "Qu"                         | 9     |

A word's score is:

```
(Σ letter values, with L×2/L×3 applied) × (M×2/M×3 word bonuses crossed) + length bonus
```

The **length bonus** adds **+5 points per letter beyond 4** (nothing under 5
letters). Because bonuses are tied to tiles, the score depends on the **path**
traced: the same word can be worth more through a better route.

## Your final rating

The end-screen percentage does **not** compare your score to every word the
board hides — that total includes obscure words no one could enter in time, so
it would be unreachable. Instead it compares you to a **realistic human
ceiling**: the score you would get by entering, non-stop at a standard pace, as
many words as the 3 minutes physically allow (the highest-scoring ones). So 100%
is a genuine, attainable target — and a very sharp player can even top it.

## Challenge a friend

The whole grid, its bonus tiles, and your score-to-beat are encoded into a share
URL. Whoever opens it plays the **same grid** and has to **beat your score** — no
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
5. **Bonus tiles.** From the same seed, on a separate PRNG stream (so the bonus
   placement doesn't shift when the roll changes), four distinct cells get a
   bonus: two **letter** bonuses (mostly L×2, sometimes L×3) and two **word**
   bonuses (mostly M×2, sometimes M×3).

**Seed source:**

- A **new game** uses a random 31-bit seed.
- A **challenge or replay** decodes the board (hence its seed) from the share
  URL token, so generation is reproducible and both players get an identical
  grid.
