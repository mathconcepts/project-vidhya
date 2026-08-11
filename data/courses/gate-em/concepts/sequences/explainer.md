# Sequences

> GATE Engineering Mathematics | Calculus | medium frequency | difficulty: 0.3

## Intuition First

A sequence is like a line of students standing in order — each has a specific position (1st, 2nd, 3rd, ...), and each holds a number. The position tells you which number you're looking at.

## Core Definition

**Sequence**: A function $a: \mathbb{N} \to \mathbb{R}$ is called a sequence, denoted as $\{a_n\}_{n=1}^{\infty}$ or $(a_n)$, where $a_n$ is the $n$-th term. A sequence is called **convergent** if $\lim_{n \to \infty} a_n = L$ for some finite $L \in \mathbb{R}$, otherwise it is **divergent**.

**Monotonic Sequences**: A sequence $(a_n)$ is:
- **Monotone increasing** if $a_n \leq a_{n+1}$ for all $n$
- **Monotone decreasing** if $a_n \geq a_{n+1}$ for all $n$
- **Bounded** if $\exists M, m \in \mathbb{R}$ such that $m \leq a_n \leq M$ for all $n$

## What Happens (Worked Example)

**Example: Convergence of a Sequence**

Consider the sequence $a_n = \frac{1}{n}$. As $n$ increases:
- $a_1 = 1$
- $a_2 = \frac{1}{2} = 0.5$
- $a_3 = \frac{1}{3} \approx 0.333$
- $a_4 = \frac{1}{4} = 0.25$
- $a_{100} = 0.01$
- $a_{1000} = 0.001$

**What happens:** As $n \to \infty$, the terms get arbitrarily close to $0$. For any $\epsilon > 0$ (say $\epsilon = 0.01$), we can find $N$ (say $N = 100$) such that $|a_n - 0| < \epsilon$ for all $n > N$. Geometrically, the sequence values cluster on a number line at the point $0$.

**Why it works:** The sequence $\{1/n\}$ is monotone decreasing and bounded below by $0$. By the Monotone Convergence Theorem, every monotone and bounded sequence converges. The limit is $\lim_{n \to \infty} \frac{1}{n} = 0$, which represents the point where all future terms are squeezed closer and closer.

## GATE MA Relevance

> **Why it matters in GATE MA:** Sequences form the foundation for series and limits. GATE questions often ask about convergence/divergence of specific sequences (e.g., $\{n^2\}$, $\{\sin(n)/n\}$), monotonicity, and boundedness. Typically worth 1–2 marks (MCQ or NAT on limit computation).
