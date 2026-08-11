# Teaching Tips: Z-Transform

## Common Student Errors

- **Confusing $z^{-n}$ with $z^n$:** In the standard Z-transform, the exponent is $z^{-n}$, not $z^n$. This is a notational choice that simplifies the transfer-function algebra (poles/zeros are easier to read). Reversing the sign leads to completely wrong answers. **Always double-check the exponent convention in your textbook.**
- **Misplacing the ROC:** The region of convergence (ROC) is crucial for distinguishing causal from non-causal sequences. A pole at $z = a$ typically implies ROC boundary $|z| = |a|$. For a **causal** system (right-sided sequence), the ROC is the exterior of the outermost pole: $|z| > |a_{\max}|$. For **anti-causal** (left-sided), it's the interior: $|z| < |a_{\min}|$. Mixing these up inverts your inverse transform.
- **Forgetting the $z$ factor in standard pairs:** Many standard pairs are given with an extra $z$ in the numerator compared to the Laplace equivalent. For example, $\mathcal{Z}^{-1}\left\{\frac{z}{z-a}\right\} = a^n u[n]$, not $\frac{1}{z-a}$. This $z$ arises naturally from summing the geometric series; don't drop it.

## GATE Question Pattern

Z-transform problems in GATE follow three main tracks: **(1) Transform computation** (direct sum or using tables + properties), **(2) Difference-equation solving** (transform the ODE-like equation, solve algebraically, inverse-transform back), and **(3) System stability analysis** (check pole locations relative to the unit circle, decide BIBO stability). Multi-step problems chain these—e.g., "Given a difference equation, (a) find the transfer function, (b) determine stability, (c) compute the step response." The trap: forgetting ROC implications, misplacing the unit-circle reference, or misapplying time-shift property ($x[n-k]$ shifts ROC boundaries).

## Speed Tricks for MCQs

- **Unit-circle reference:** Always picture the unit circle $|z|=1$ in the complex plane. Pole inside → stable exponential decay. Pole on circle → marginally stable (oscillation). Pole outside → instability (growth). This 1-second visual check rules out wrong answers instantly.
- **Standard sequence patterns:** $u[n] \Rightarrow \frac{z}{z-1}$, $a^n u[n] \Rightarrow \frac{z}{z-a}$, $n a^n u[n] \Rightarrow \frac{az}{(z-a)^2}$. Memorizing the 5–6 most common sequences covers ~60% of GATE problems.
- **Property application:** The shift property $x[n-k] u[n-k] \leftrightarrow z^{-k} X(z)$ (causality-preserving) is different from the Laplace shift (which includes exponential damping). Get the property exactly right before plugging in; even one sign error cascades through the whole problem.

## Must-Memorize Formulas & Standard Pairs

**Z-Transform Definition:**

$$X(z) = \sum_{n=-\infty}^\infty x[n] z^{-n}$$

**Standard Sequence Pairs:**

| Sequence $x[n]$ | Z-Transform $X(z)$ | ROC |
|---|---|---|
| $\delta[n]$ | $1$ | All $z$ |
| $u[n]$ | $\frac{z}{z-1}$ | $\|z\| > 1$ |
| $a^n u[n]$ | $\frac{z}{z-a}$ | $\|z\| > \|a\|$ |
| $n a^n u[n]$ | $\frac{az}{(z-a)^2}$ | $\|z\| > \|a\|$ |
| $\cos(\omega_0 n) u[n]$ | $\frac{z(z - \cos\omega_0)}{z^2 - 2z\cos\omega_0 + 1}$ | $\|z\| > 1$ |
| $\sin(\omega_0 n) u[n]$ | $\frac{z\sin\omega_0}{z^2 - 2z\cos\omega_0 + 1}$ | $\|z\| > 1$ |
| $a^n \cos(\omega_0 n) u[n]$ | $\frac{z(z - a\cos\omega_0)}{z^2 - 2az\cos\omega_0 + a^2}$ | $\|z\| > \|a\|$ |
| $a^n \sin(\omega_0 n) u[n]$ | $\frac{az\sin\omega_0}{z^2 - 2az\cos\omega_0 + a^2}$ | $\|z\| > \|a\|$ |

**Key Properties:**

$$\text{Linearity: } a x_1[n] + b x_2[n] \leftrightarrow a X_1(z) + b X_2(z)$$

$$\text{Time-shift: } x[n-k] u[n-k] \leftrightarrow z^{-k} X(z)$$ (causal)

$$\text{Frequency-shift: } a^n x[n] \leftrightarrow X(z/a)$$

$$\text{Multiplication by $n$: } n x[n] \leftrightarrow -z \frac{dX(z)}{dz}$$

$$\text{Convolution: } x_1[n] * x_2[n] \leftrightarrow X_1(z) X_2(z)$$

**Stability Criterion (Causal LTI Systems):**

- All poles of $H(z)$ **strictly inside** unit circle $|z| < 1$ → BIBO stable
- Any pole on unit circle → marginally stable (non-decaying oscillations)
- Any pole outside unit circle → unstable

**Transfer Function from Difference Equation:**

For $y[n] + a_1 y[n-1] + \cdots + a_N y[n-N] = b_0 x[n] + b_1 x[n-1] + \cdots + b_M x[n-M]$:

$$H(z) = \frac{Y(z)}{X(z)} = \frac{b_0 + b_1 z^{-1} + \cdots + b_M z^{-M}}{1 + a_1 z^{-1} + \cdots + a_N z^{-N}}$$

or equivalently, multiplying numerator and denominator by $z^{\max(N,M)}$:

$$H(z) = \frac{b_0 z^N + b_1 z^{N-1} + \cdots + b_M z^{N-M}}{z^N + a_1 z^{N-1} + \cdots + a_N}$$
