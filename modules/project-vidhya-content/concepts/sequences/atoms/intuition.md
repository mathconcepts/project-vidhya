---
id: sequences.intuition
concept_id: sequences
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
---

# Understanding Sequences: The Foundation of Convergence

A **sequence** is simply an ordered list of numbers that follow a rule: $a_1, a_2, a_3, \ldots$ where each term is defined by its position. Think of a sequence as a journey—each step is labeled by its order.

## Three Key Ideas

**Convergence**: A sequence $\{a_n\}$ **converges to a limit** $L$ if the terms get arbitrarily close to $L$ as $n$ grows. Imagine climbing a ladder where each rung gets closer to a ceiling; eventually you're almost touching it. Formally, for *any* distance (no matter how small), all terms beyond some point stay within that distance from $L$. The sequence $a_n = \frac{1}{n}$ converges to 0 because the fractions $1, 0.5, 0.33, 0.25, \ldots$ get arbitrarily close to zero.

**Divergence**: A sequence that doesn't converge is **divergent**. Either it grows without bound (like $a_n = n$) or oscillates without settling down. The sequence $a_n = (-1)^n$ bounces forever between $-1$ and $1$—it never homes in on any single value.

**Boundedness**: A sequence is **bounded** if all its terms stay within some fixed interval—like $-M \leq a_n \leq M$ for some constant $M$. The sequence $a_n = \sin(n)$ is bounded because sine values always stay between $-1$ and $1$. Boundedness is necessary but *not sufficient* for convergence (a bounded sequence might still diverge by oscillating).

## Why It Matters for GATE

Convergence tests and limit calculations appear in calculus, differential equations, and series problems. Understanding when and why sequences converge lets you handle infinite series, power series solutions, and Fourier analysis with confidence.
```

---