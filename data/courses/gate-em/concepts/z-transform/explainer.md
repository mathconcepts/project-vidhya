# Z-Transform

> GATE Engineering Mathematics | Transform Theory | medium frequency | difficulty: 0.6

## Intuition First

The Z-transform is the discrete-time counterpart of the Laplace transform. While Laplace handles continuous-time signals (analog), the Z-transform handles discrete-time sequences (digital samples). Instead of $e^{st}$, you use $z^{-n}$ where $n$ is the sample index. It's how digital signal processors (DSPs), filters, and control systems analyze sequences: turn a recurrence relation into an algebraic equation, solve in the $z$-domain, and inverse-transform back.

## Core Definition

**The Z-Transform**: For a discrete-time sequence $x[n]$ (defined for $n = 0, 1, 2, \ldots$ or $\ldots, -1, 0, 1, \ldots$):

$$X(z) = \sum_{n=-\infty}^\infty x[n] z^{-n}$$

where $z$ is a complex variable. The inverse Z-transform recovers the sequence:

$$x[n] = \frac{1}{2\pi j} \oint X(z) z^{n-1} dz$$

where the contour is a closed path in the region of convergence (ROC). **In practice**, for rational $X(z)$, we use partial fractions, just as with Laplace transforms.

**Relationship to Laplace and Fourier transforms:** If a continuous-time signal $f(t)$ is **sampled** at times $t = nT_s$ (where $T_s$ is the sample period), the discrete-time sequence is $x[n] = f(nT_s)$. The Z-transform of $x[n]$ is related to the Laplace transform of the sampled signal: $z = e^{sT_s}$.

**Geometric interpretation:** Poles and zeros of $X(z)$ lie in the complex $z$-plane. For a causal, stable discrete-time system, all poles must lie **inside the unit circle** $|z| = 1$. Poles on the unit circle → marginal stability (oscillatory boundary); outside → instability (exponential growth).

## What Happens (Worked Example)

**Example**: Find the Z-transform of the exponential sequence $x[n] = a^n u[n]$ (where $u[n]$ is the unit step: $u[n] = 1$ for $n \geq 0$, zero otherwise).

**What happens:**

$$X(z) = \sum_{n=0}^\infty a^n z^{-n} = \sum_{n=0}^\infty \left(\frac{a}{z}\right)^n$$

This is a geometric series with ratio $\frac{a}{z}$. For convergence, $\left|\frac{a}{z}\right| < 1$, i.e., $|z| > |a|$:

$$X(z) = \frac{1}{1 - \frac{a}{z}} = \frac{z}{z - a}, \quad |z| > |a|$$

The **pole** is at $z = a$. The **ROC** is the region $|z| > |a|$.

**Why it works:**

The geometric series sums to $\frac{1}{1-r}$ when $|r| < 1$. Here, $r = \frac{a}{z}$. The pole location $z = a$ directly encodes the exponential growth rate: if $|a| < 1$, the sequence decays (pole inside unit circle, stable); if $|a| = 1$, borderline oscillatory (pole on unit circle); if $|a| > 1$, exponential growth (pole outside, unstable). The ROC boundary separates growth from decay regimes.

## GATE MA Relevance

> **Why it matters in GATE MA:** Z-transform appears in 3–5% of GATE papers, concentrated in signal processing and digital control topics. Problems typically ask to (1) compute $X(z)$ for standard sequences, (2) analyze stability via pole locations, (3) find the difference-equation solution via inverse Z-transform, or (4) design simple discrete-time filters using pole-zero placement. Understanding Z-transform is essential for digital signal processing, digital control systems, and DSP algorithm design.
