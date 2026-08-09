# Infinite Series

> GATE Engineering Mathematics | Calculus | medium frequency | difficulty: 0.4

## Intuition First

A series is the sum of a sequence — like adding up an infinite list of numbers. The question is: does this infinite sum land on a finite number, or does it blow up to infinity?

## Core Definition

**Infinite Series**: Given a sequence $(a_n)$, the infinite series is the formal sum $\sum_{n=1}^{\infty} a_n = a_1 + a_2 + a_3 + \ldots$. The $n$-th partial sum is $S_n = \sum_{k=1}^{n} a_k$. The series **converges** to a sum $S$ if $\lim_{n \to \infty} S_n = S$. Otherwise it **diverges**.

**Geometric Series**: A series of the form $\sum_{n=0}^{\infty} ar^n$ where $a$ is the first term and $r$ is the common ratio.
- **Converges** to $\frac{a}{1-r}$ if $|r| < 1$
- **Diverges** if $|r| \geq 1$

**Harmonic Series**: $\sum_{n=1}^{\infty} \frac{1}{n}$ diverges (one of the most important results in calculus).

## What Happens (Worked Example)

**Example: Geometric Series**

Consider $\sum_{n=1}^{\infty} \left(\frac{1}{2}\right)^n = \frac{1}{2} + \frac{1}{4} + \frac{1}{8} + \frac{1}{16} + \ldots$

Partial sums:
- $S_1 = \frac{1}{2}$
- $S_2 = \frac{1}{2} + \frac{1}{4} = \frac{3}{4}$
- $S_3 = \frac{3}{4} + \frac{1}{8} = \frac{7}{8}$
- $S_4 = \frac{7}{8} + \frac{1}{16} = \frac{15}{16}$
- $S_n = 1 - \frac{1}{2^n}$

**What happens:** As $n \to \infty$, $S_n = 1 - \frac{1}{2^n} \to 1$. The sum converges to $1$. Geometrically, each term fills the remaining gap by exactly half: we're approaching $1$ but never exceeding it.

**Why it works:** Since $|r| = 1/2 < 1$, the geometric series formula gives $S = \frac{1/2}{1 - 1/2} = \frac{1/2}{1/2} = 1$.

## GATE MA Relevance

> **Why it matters in GATE MA:** Series convergence is a core topic. GATE asks: test convergence using D'Alembert, Cauchy, or comparison tests; find sums of specific series (geometric, telescoping); or identify divergent series. Often worth 2 marks (MCQ). The harmonic series vs. geometric series distinction is a high-frequency trap.
