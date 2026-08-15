---
id: counting-principles.intuition
concept_id: counting-principles
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
---

# Counting Principles: Building Blocks of Probability

Counting principles are the foundation of probability and combinatorics — they answer: "In how many ways can we arrange or select objects?"

## The Two Core Scenarios

**Permutations** arise when **order matters**. If you're arranging 3 books on a shelf, picking the first book, then the second, then the third gives different arrangements. With $n$ distinct objects, there are $n!$ ways to arrange them all. For $r$ items from $n$: $P(n,r) = \frac{n!}{(n-r)!}$.

**Combinations** arise when **order doesn't matter**. If you're selecting 3 people for a committee, choosing Alice-Bob-Carol is the same as Carol-Bob-Alice. With $n$ distinct objects, the number of ways to choose $r$ is: $C(n,r) = \binom{n}{r} = \frac{n!}{r!(n-r)!}$.

## The Pigeonhole Principle

This principle states: if you have $n$ pigeonholes and $n+1$ pigeons, at least one hole must contain 2+ pigeons. In exams, this guarantees the existence of equal elements or conflicts without counting them all.

## Why It Matters for GATE

Counting principles let you solve problems about seating arrangements, password generation, selecting teams, partitioning sets, and probability calculations. They're rarely asked directly, but every probability problem leans on them — mastering counting avoids errors later.

**Key insight:** Identify whether order matters (permutation) or not (combination), then apply the formula mechanically.
