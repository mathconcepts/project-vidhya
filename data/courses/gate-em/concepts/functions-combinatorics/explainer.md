# Functions & Combinatorics
> GATE Engineering Mathematics | Discrete Mathematics | medium frequency | difficulty: 0.4

## Intuition First
A function is a machine: you feed it an input from set $A$, and it reliably outputs exactly one value in set $B$. Combinatorics counts how many ways you can arrange, select, or combine objects—like asking "how many ways can I choose 3 people from a group of 10?" or "how many ways can I arrange 5 books on a shelf?" Functions and combinatorics are deeply linked: counting functions from set $A$ to set $B$ is a classic combinatorial problem.

## Core Definition
**Function**: A relation $f: A \to B$ is a function if every element $a \in A$ is paired with exactly one element $f(a) \in B$.
- **Injective (one-to-one)**: If $f(a) = f(b)$, then $a = b$. No two inputs map to the same output.
- **Surjective (onto)**: For every $b \in B$, there exists $a \in A$ such that $f(a) = b$. Every output is "covered."
- **Bijective**: Both injective and surjective. There is a perfect one-to-one pairing between $A$ and $B$.

**Combinatorial Fundamentals**:
- **Permutation**: An ordered arrangement of $n$ distinct objects. $P(n) = n! = n \cdot (n-1) \cdot \ldots \cdot 1$.
- **Combination**: An unordered selection of $k$ objects from $n$ objects. $\binom{n}{k} = \frac{n!}{k!(n-k)!}$.
- **Binomial Theorem**: $(a + b)^n = \sum_{k=0}^{n} \binom{n}{k} a^{n-k} b^k$.

## What Happens (Worked Example)
**What happens:** Let $A = \{1, 2, 3\}$ and $B = \{a, b, c, d\}$. Count injective functions $f: A \to B$.

For injectivity, each element of $A$ must map to a different element of $B$:
- $f(1)$ can be any of 4 choices: $a, b, c, d$.
- $f(2)$ can be any of 3 remaining choices (must differ from $f(1)$).
- $f(3)$ can be any of 2 remaining choices (must differ from $f(1), f(2)$).

Total injective functions: $4 \times 3 \times 2 = 24 = \frac{4!}{(4-3)!} = P(4, 3)$.

Alternatively, we are selecting an ordered 3-subset of 4 objects, which equals the falling factorial: $4^{\underline{3}} = 4 \times 3 \times 2 = 24$.

**Why it works**: Injectivity forces each element to "claim" a unique output. The first element claims one of 4, leaving 3 for the second, 2 for the third. Geometrically, we are placing 3 distinct balls into 4 distinct bins with at most one ball per bin. The count reflects the exhaustive enumeration of non-colliding placements.

## GATE MA Relevance
> **Why it matters in GATE MA:** Functions and combinatorics appear in 4-6% of GATE papers. Questions typically involve: counting injective/surjective/bijective functions between finite sets (often as NAT questions), applying the binomial theorem or combinatorial identities to simplify expressions, and counting constrained arrangements (e.g., "how many ways to arrange $n$ people with restrictions?"). Common trap: confusing "onto" with "one-to-one" or misapplying the binomial coefficient formula. Most questions are 1-2 marks, mixing quick recall with short enumeration.
