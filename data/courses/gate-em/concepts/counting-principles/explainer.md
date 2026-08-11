# Counting Principles

> GATE Engineering Mathematics | Probability & Statistics | medium frequency | difficulty: 0.3

## Intuition First
Imagine arranging 5 students in a line for a photo — order matters. Now imagine selecting 3 students for a team where order doesn't matter. Counting principles give us formulas to avoid tediously listing every possibility.

## Core Definition

**Fundamental Counting Principle (Product Rule)**: If event A can occur in $m$ ways and event B can occur in $n$ ways, then both events can occur in sequence in $m \times n$ ways.

**Permutation**: An ordered arrangement of $r$ objects selected from $n$ distinct objects. 
$$P(n, r) = \frac{n!}{(n-r)!}$$
Geometric interpretation: each position has progressively fewer choices — position 1 has $n$ choices, position 2 has $n-1$ choices, etc.

**Combination**: An unordered selection of $r$ objects from $n$ distinct objects.
$$C(n, r) = \binom{n}{r} = \frac{n!}{r!(n-r)!}$$
Geometric interpretation: combinations equal permutations divided by the number of ways to rearrange the selected $r$ objects among themselves.

## What Happens (Worked Example)

Label: "**What happens:**"

**Problem**: A software company has 8 engineers. They need to (a) select 3 for a code review team, and (b) assign 3 distinct roles (Team Lead, Reviewer 1, Reviewer 2) to 3 of the 8 engineers. How many ways for each?

(a) **Combination** (order doesn't matter):
$$C(8, 3) = \frac{8!}{3! \cdot 5!} = \frac{8 \times 7 \times 6}{3 \times 2 \times 1} = \frac{336}{6} = 56 \text{ ways}$$

(b) **Permutation** (order matters — roles are distinct):
$$P(8, 3) = \frac{8!}{5!} = 8 \times 7 \times 6 = 336 \text{ ways}$$

Label: "**Why it works:**"

For combinations, we first count all ordered selections ($P(8,3) = 336$), but since the 3 selected engineers can be rearranged in $3! = 6$ ways and all these rearrangements represent the same unordered team, we divide by 6. For permutations, each role is a distinct position, so we multiply the number of choices for each position sequentially without division.

## GATE MA Relevance
> **Why it matters in GATE MA:** Counting principles form the foundation for all probability calculations in GATE — they appear in ~15% of probability questions as "find the number of outcomes" type MCQs, and often in NAT problems requiring enumeration of sample spaces. Mastery here prevents errors in probability denominators.
