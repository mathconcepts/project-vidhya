---
id: discrete-distributions.visual-analogy
concept_id: discrete-distributions
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.30
exam_ids: ["*"]
scaffold_fade: true
---

## The Coin Flip Hierarchy

Imagine flipping a fair coin over and over. Three questions naturally arise:

**"How many heads in 10 flips?"** → **Binomial distribution**. You fix the number of trials ($n=10$), each trial has probability $p=0.5$, and you count successes. The probability peaks at 5 heads, but 4, 6, or 3 are all plausible.

**"How long until my first heads?"** → **Geometric distribution**. You keep flipping until success, asking "Did I get heads on flip 1? On flip 2? On flip 3?" The probability drops sharply—getting heads on the first flip is much more likely than on the 50th.

**"I have 100 biased coins: 40 are fair, 60 are rigged (always heads). I grab 10 randomly. How many fair coins did I grab?"** → **Hypergeometric distribution**. You're sampling *without replacement* from a finite pool, so each draw changes the pool's composition.

```gif-scene
{
  "type": "discrete-bars",
  "values": [0.0009765625, 0.009765625, 0.0439453125, 0.1171875, 0.205078125, 0.24609375, 0.205078125, 0.1171875, 0.0439453125, 0.009765625, 0.0009765625],
  "labels": ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
  "title": "Binomial: Heads in 10 Fair Coin Flips"
}
```

Each story (fixed trials vs. time-to-first vs. sampling without replacement) unlocks a different formula. Learn to **see the coin flip story** in your problem, and the distribution follows automatically.
