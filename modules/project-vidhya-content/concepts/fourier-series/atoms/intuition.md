---
id: fourier-series-intuition
concept_id: fourier-series
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
---

# Fourier Series — Intuition

## Core Idea

Any **periodic function** with period $2L$ can be expressed as an infinite sum of sines and cosines (harmonics):

$$f(x) = \frac{a_0}{2} + \sum_{n=1}^{\infty}\left[a_n\cos\frac{n\pi x}{L} + b_n\sin\frac{n\pi x}{L}\right]$$

The coefficients are computed by exploiting **orthogonality** of the trig functions on $[-L, L]$:

$$a_0 = \frac{1}{L}\int_{-L}^{L} f(x)\,dx$$

$$a_n = \frac{1}{L}\int_{-L}^{L} f(x)\cos\frac{n\pi x}{L}\,dx, \quad n \geq 1$$

$$b_n = \frac{1}{L}\int_{-L}^{L} f(x)\sin\frac{n\pi x}{L}\,dx, \quad n \geq 1$$

The term $\dfrac{a_0}{2}$ is the **mean value** (DC component) of $f$ over one period.

---

## Even and Odd Symmetry (Half-Range Shortcuts)

| Function type | Which coefficients survive |
|---|---|
| $f$ is **even** $\bigl(f(-x)=f(x)\bigr)$ | Only $a_0, a_n$ (cosine series); all $b_n = 0$ |
| $f$ is **odd** $\bigl(f(-x)=-f(x)\bigr)$ | Only $b_n$ (sine series); $a_0 = 0$ and all $a_n = 0$ |
| Neither | All coefficients potentially non-zero |

**Parity saves half the integrals** — recognise the symmetry before computing.

---

## Dirichlet Conditions (When Does It Converge?)

The Fourier series converges to $f(x)$ at all points of continuity, and to the **average** $\dfrac{f(x^+)+f(x^-)}{2}$ at jump discontinuities, provided $f$ has:
1. Finitely many maxima and minima per period.
2. Finitely many (finite) discontinuities per period.
3. $\int_{-L}^{L}|f(x)|\,dx < \infty$.

---

## Gibbs Phenomenon

At a **jump discontinuity**, the partial sum overshoots the actual jump by approximately $9\%$ of the jump size, regardless of how many terms are included. This overshoot does not disappear as more terms are added — it only narrows.

---

## Parseval's Theorem (Energy Identity)

$$\frac{1}{L}\int_{-L}^{L} [f(x)]^2\,dx = \frac{a_0^2}{2} + \sum_{n=1}^{\infty}(a_n^2 + b_n^2)$$

This links the total "energy" of $f$ to the sum of squared amplitudes of its harmonics. GATE uses it to evaluate infinite series like $\sum \dfrac{1}{n^2}$.

---

## GATE Pattern Recognition

| What you see | What to do |
|---|---|
| $f(-x) = f(x)$ | Set all $b_n = 0$; halve the interval to $[0,L]$ in integrals |
| $f(-x) = -f(x)$ | Set $a_0 = a_n = 0$; work only on $[0,L]$ |
| "Find the sum of $\sum 1/n^2$" | Compute Fourier series, apply Parseval at a specific point |
| Convergence at a discontinuity | Answer is the average of left and right limits |
