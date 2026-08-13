---
id: discrete-distributions.intuition
concept_id: discrete-distributions
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
---

## Why Discrete Distributions Matter

Whenever you count outcomes — number of defects in a batch, failed login attempts, or people who pass an exam — you're working with a **discrete random variable**: one that takes only specific, countable values (0, 1, 2, ...). Discrete distributions tell you the probability of each outcome.

Think of it this way: a continuous distribution (like the normal curve) models something that can be any value along a range. A discrete distribution models something that happens a specific number of times.

### The Four Essential Distributions

**Binomial**: Repeat an experiment $n$ times. Each trial succeeds with probability $p$. Count the total successes. (Example: 100 coin flips, how many heads?)

**Poisson**: Count rare events in a fixed time interval, when events happen independently at an average rate. (Example: emails arriving in 1 hour, when average is 5/hour.)

**Geometric**: Keep trying until the first success. How many trials until you win? (Example: rolling a die until you get a 6.)

**Hypergeometric**: Draw items from a finite pool without replacement. How many match your target? (Example: 5 defective out of 50 items; inspect 10 items; how many defective in your sample?)

Each distribution answers a specific **story**: Are you counting successes in $n$ fixed trials (binomial)? Rare events in time (Poisson)? Time to first win (geometric)? Matches in a sample without replacement (hypergeometric)?

The key to mastery is learning to **recognize the story**, then apply the right formula.
```

**File 2:
