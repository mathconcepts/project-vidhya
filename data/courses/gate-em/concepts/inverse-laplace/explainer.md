# Inverse Laplace Transform

> GATE Engineering Mathematics | Transform Theory | high frequency | difficulty: 0.5

## Intuition First

If the Laplace transform converts a time signal into a frequency-domain snapshot (with poles showing decay rates), the inverse transform *reconstructs* the original time-domain signal from that snapshot. It's like developing a photograph: the $s$-domain is the negative, and the inverse transform is the chemical process that recovers the picture.

## Core Definition

**The Inverse Laplace Transform**: Given $F(s)$, the inverse Laplace transform recovers $f(t)$:

$$f(t) = \mathcal{L}^{-1}\{F(s)\} = \frac{1}{2\pi j} \int_{\sigma - j\infty}^{\sigma + j\infty} e^{st} F(s) \, ds$$

where the integration is along a vertical line in the complex plane (at Re$(s) = \sigma$, within the ROC). **In practice**, for rational $F(s)$, we use **partial fraction decomposition** rather than the Bromwich integral: decompose $F(s)$ into simple fractions and match each to a standard inverse-transform pair.

**Geometric interpretation**: Each term $\frac{A}{s+a}$ in the partial-fraction expansion corresponds to a pole at $s = -a$. The location of the pole (its distance from the imaginary axis) directly encodes the exponential decay rate of the time-domain signal. A pole at $s = -3$ produces a factor $e^{-3t}$.

## What Happens (Worked Example)

**Example**: Find the inverse Laplace transform of $F(s) = \frac{5}{(s+1)(s+3)}$.

**What happens:**

First, partial fraction decomposition:
$$\frac{5}{(s+1)(s+3)} = \frac{A}{s+1} + \frac{B}{s+3}$$

Multiply both sides by $(s+1)(s+3)$:
$$5 = A(s+3) + B(s+1)$$

Setting $s = -1$: $5 = A(2) \Rightarrow A = 2.5$  
Setting $s = -3$: $5 = B(-2) \Rightarrow B = -2.5$

Thus:
$$F(s) = \frac{2.5}{s+1} + \frac{-2.5}{s+3}$$

Using the standard pair $\mathcal{L}^{-1}\left\{\frac{1}{s+a}\right\} = e^{-at}$:

$$f(t) = 2.5 e^{-t} - 2.5 e^{-3t}, \quad t \geq 0$$

**Why it works:**

Partial fraction decomposition breaks a complex rational function into simple building blocks, each of which matches a standard inverse-transform pair from a lookup table. The poles (at $s = -1$ and $s = -3$) directly determine the exponential decay rates in the time domain (rates $1$ and $3$, respectively). The residues ($A$ and $B$) scale the amplitude of each exponential component.

## GATE MA Relevance

> **Why it matters in GATE MA:** Inverse Laplace appears in 5–7% of GATE papers. It's typically tested via partial-fraction identification and matching to standard time-domain waveforms. Combined with differential-equation solving, it's essential for circuit and control problems.
