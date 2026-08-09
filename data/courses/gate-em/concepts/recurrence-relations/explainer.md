# Recurrence Relations
> GATE Engineering Mathematics | Discrete Mathematics | medium frequency | difficulty: 0.5

## Intuition First
A recurrence relation is a rule that defines each term of a sequence based on previous terms. Think of it like a recipe that says "to make the next cake, use ingredients from the previous two cakes plus some new flour." The classic example: Fibonacci numbers, where each number is the sum of the two before it ($F_n = F_{n-1} + F_{n-2}$). Recurrence relations describe growth, counts, and iterative processes in computer science and engineering.

## Core Definition
**Recurrence Relation**: An equation that defines a sequence $\{a_n\}$ by expressing $a_n$ in terms of previous terms $a_{n-1}, a_{n-2}, \ldots, a_{n-k}$ plus possibly a function of $n$.

**Linear Homogeneous Recurrence Relation** (order $k$):
$$a_n = c_1 a_{n-1} + c_2 a_{n-2} + \cdots + c_k a_{n-k}$$
where $c_1, \ldots, c_k$ are constants.

**Solution Method**: Assume $a_n = r^n$ and substitute to get the **characteristic equation**:
$$r^n = c_1 r^{n-1} + c_2 r^{n-2} + \cdots + c_k r^{n-k}$$
Divide by $r^{n-k}$:
$$r^k = c_1 r^{k-1} + c_2 r^{k-2} + \cdots + c_k$$
Solve for roots $r_1, r_2, \ldots, r_k$. The general solution is $a_n = A_1 r_1^n + A_2 r_2^n + \cdots + A_k r_k^n$, with constants $A_i$ determined by initial conditions.

## What Happens (Worked Example)
**What happens:** Solve the recurrence $a_n = 3a_{n-1} - 2a_{n-2}$ with $a_0 = 1, a_1 = 3$.

**Step 1: Find the characteristic equation.** Assume $a_n = r^n$:
$$r^2 = 3r - 2 \Rightarrow r^2 - 3r + 2 = 0 \Rightarrow (r-1)(r-2) = 0$$
Roots: $r_1 = 1, r_2 = 2$.

**Step 2: General solution.**
$$a_n = A_1 \cdot 1^n + A_2 \cdot 2^n = A_1 + A_2 \cdot 2^n$$

**Step 3: Use initial conditions to find $A_1, A_2$.**
- $a_0 = 1$: $A_1 + A_2 = 1$
- $a_1 = 3$: $A_1 + 2A_2 = 3$

Subtracting: $A_2 = 2$, so $A_1 = -1$.

**Step 4: Closed form.**
$$a_n = -1 + 2 \cdot 2^n = 2^{n+1} - 1$$

**Verification**: $a_0 = 2^1 - 1 = 1$ ✓, $a_1 = 2^2 - 1 = 3$ ✓, $a_2 = 3 \cdot 3 - 2 \cdot 1 = 7$ and $2^3 - 1 = 7$ ✓.

**Why it works**: The characteristic equation captures the recursive structure; roots tell us what exponential terms compose the sequence. The superposition of exponentials (each scaled by $A_i$) reflects the geometric interpretation: the sequence is a linear combination of pure geometric progressions, whose growth rates are encoded in the roots.

## GATE MA Relevance
> **Why it matters in GATE MA:** Recurrence relations appear in 3-5% of GATE papers. Questions focus on: solving linear homogeneous recurrences via the characteristic-equation method, counting combinatorial objects (number of binary strings, arrangements) that naturally satisfy recurrences, and recognizing closed forms (e.g., Fibonacci $F_n = \frac{\phi^n - \psi^n}{\sqrt{5}}$). Common trap: forgetting to apply initial conditions or making algebraic errors in the characteristic equation. Usually 1-2 marks, with NAT questions asking for a specific term or a closed-form formula.
