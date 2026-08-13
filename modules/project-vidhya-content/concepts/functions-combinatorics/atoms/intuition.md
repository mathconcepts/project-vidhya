---
id: functions-combinatorics-intuition
concept_id: functions-combinatorics
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
---

# Functions and Combinatorics — Core Intuition

## Functions as Mappings

A **function** $f: A \to B$ assigns to each element of $A$ exactly one element of $B$.

- $A$ = **domain**, $B$ = **codomain**, $f(A)$ = **range** (the actual outputs)

### Types of Functions

**Injective (one-to-one):** No two inputs map to the same output.
$$f(a_1) = f(a_2) \Rightarrow a_1 = a_2$$
Condition: $|A| \leq |B|$.

**Surjective (onto):** Every element of $B$ is hit by at least one input.
$$\forall b \in B,\; \exists a \in A : f(a) = b$$
Condition: $|A| \geq |B|$.

**Bijective:** Both injective and surjective — a perfect one-to-one correspondence.
Condition: $|A| = |B|$. Bijections have inverses.

---

## Counting Fundamentals

### Permutations — Order Matters

The number of ways to arrange $r$ objects chosen from $n$ distinct objects:

$$P(n, r) = \frac{n!}{(n-r)!} = n \cdot (n-1) \cdots (n-r+1)$$

Special case: $P(n, n) = n!$ — arranging all $n$ objects.

### Combinations — Order Does NOT Matter

The number of ways to choose $r$ objects from $n$ distinct objects:

$$C(n, r) = \binom{n}{r} = \frac{n!}{r!\,(n-r)!}$$

**Memory rule:** Permutations = **P**lace them (order matters). Combinations = **C**hoose them (order irrelevant).

$$P(n,r) = r! \cdot C(n,r)$$

---

## Pigeonhole Principle

If $n$ items are placed into $k$ containers and $n > k$, then at least one container holds $\geq \lceil n/k \rceil$ items.

**Simple form:** $n+1$ items into $n$ containers → at least one container has $\geq 2$ items.

**Example:** Among any 13 people, at least 2 share the same birth month.

---

## Inclusion-Exclusion for Counting

To count the size of a union, alternately add and subtract intersections:

$$|A_1 \cup A_2 \cup \cdots \cup A_n| = \sum|A_i| - \sum|A_i \cap A_j| + \sum|A_i \cap A_j \cap A_k| - \cdots$$

---

## Binomial Theorem

$$(x + y)^n = \sum_{k=0}^{n} \binom{n}{k} x^k y^{n-k}$$

Key facts:
- Coefficient of $x^k y^{n-k}$ is $\binom{n}{k}$.
- Sum of all coefficients: set $x = y = 1$ → $2^n$.
- Alternating sum: set $x = 1, y = -1$ → $0$ (for $n \geq 1$).

---

## Quick Counts to Memorize

| Scenario | Formula |
|---|---|
| Arrange $n$ distinct objects | $n!$ |
| Choose $r$ from $n$ (unordered, no repetition) | $\binom{n}{r}$ |
| Choose $r$ from $n$ (ordered, no repetition) | $P(n,r) = \frac{n!}{(n-r)!}$ |
| Choose $r$ from $n$ (unordered, with repetition) | $\binom{n+r-1}{r}$ (stars and bars) |
| Distribute $n$ distinct into $k$ distinct boxes | $k^n$ |
