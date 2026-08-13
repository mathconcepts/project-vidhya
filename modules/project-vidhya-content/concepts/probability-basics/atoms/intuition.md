---
id: probability-basics-intuition
concept_id: probability-basics
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
---

# What Is Probability?

Probability is the mathematics of uncertainty — a precise way to measure how likely an outcome is.

## The Sample Space

Every random experiment has a **sample space** $\Omega$: the set of all possible outcomes.

- Tossing a coin: $\Omega = \{H, T\}$
- Rolling a die: $\Omega = \{1, 2, 3, 4, 5, 6\}$
- Picking a real number in $[0,1]$: $\Omega = [0,1]$

An **event** $A$ is any subset of $\Omega$. The event "roll an even number" is $A = \{2, 4, 6\}$.

## Probability Axioms

A probability measure $P$ assigns a number to every event and satisfies three axioms (Kolmogorov):

1. $P(A) \geq 0$ for every event $A$
2. $P(\Omega) = 1$ (something must happen)
3. For mutually exclusive events $A \cap B = \emptyset$: $P(A \cup B) = P(A) + P(B)$

## Addition Rule

When events are **not** mutually exclusive, inclusion-exclusion corrects for double-counting:

$$P(A \cup B) = P(A) + P(B) - P(A \cap B)$$

**Why:** $A \cup B$ includes every outcome in $A$ or $B$. When you add $P(A) + P(B)$, outcomes in $A \cap B$ get counted twice — so subtract once.

## Conditional Probability

$P(A \mid B)$ is the probability of $A$ **given that** $B$ has already occurred. It restricts the sample space to $B$:

$$P(A \mid B) = \frac{P(A \cap B)}{P(B)}, \quad P(B) > 0$$

Think of it as zooming in: once you know $B$ happened, what fraction of $B$ also has $A$?

## Independence

Events $A$ and $B$ are **independent** when knowing $B$ gives no information about $A$:

$$P(A \cap B) = P(A) \cdot P(B)$$

Equivalently, $P(A \mid B) = P(A)$. Coin tosses across different flips are independent; drawing without replacement are not.

## Bayes' Theorem

Bayes flips the direction of conditioning — it lets you update a prior belief with new evidence:

$$P(A \mid B) = \frac{P(B \mid A)\, P(A)}{P(B)}$$

The denominator expands using the **law of total probability**: if $\{A_1, A_2, \ldots, A_n\}$ is a partition of $\Omega$,

$$P(B) = \sum_{i=1}^{n} P(B \mid A_i)\, P(A_i)$$

**Key insight:** Bayes' theorem is the engine for reasoning backwards — from effect to cause — which is exactly what GATE questions on diagnostic tests and factory defects exploit.
