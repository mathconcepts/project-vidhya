# Fourier Series

> GATE Engineering Mathematics | Transform Theory | high frequency | difficulty: 0.5

## Intuition First

Any periodic signal—a square wave, a sawtooth, a repeating musical note—can be reconstructed as an infinite sum of sine and cosine waves at different frequencies. The Fourier series is the ultimate decomposition tool: it breaks a complex periodic waveform into its harmonic building blocks, each oscillating at an integer multiple of the fundamental frequency.

## Core Definition

**The Fourier Series (Real Form)**: For a periodic function $f(t)$ with period $T$:

$$f(t) = \frac{a_0}{2} + \sum_{n=1}^\infty \left[ a_n \cos\left(\frac{2\pi n t}{T}\right) + b_n \sin\left(\frac{2\pi n t}{T}\right) \right]$$

where the coefficients are:

$$a_0 = \frac{2}{T} \int_0^T f(t) \, dt \quad \text{(DC component)}$$

$$a_n = \frac{2}{T} \int_0^T f(t) \cos\left(\frac{2\pi n t}{T}\right) dt \quad \text{(cosine amplitudes)}$$

$$b_n = \frac{2}{T} \int_0^T f(t) \sin\left(\frac{2\pi n t}{T}\right) dt \quad \text{(sine amplitudes)}$$

The fundamental frequency is $f_1 = \frac{1}{T}$ (or $\omega_1 = \frac{2\pi}{T}$ in radians/sec). Higher harmonics oscillate at $nf_1, 2nf_1, \ldots$

**Geometric interpretation**: Each integral $a_n$ (or $b_n$) is a projection of $f(t)$ onto the basis function $\cos(n\omega_1 t)$ (or $\sin(n\omega_1 t)$). Orthogonality of sines and cosines ensures that each harmonic captures exactly one frequency component, with no interference. The process is like taking snapshots of $f(t)$ at all possible pure-tone frequencies and measuring how much of each tone is present.

## What Happens (Worked Example)

**Example**: Find the Fourier series of the square wave: $f(t) = \begin{cases} 1 & 0 \leq t < \frac{T}{2} \\ -1 & \frac{T}{2} \leq t < T \end{cases}$ with period $T$.

**What happens:**

Compute $a_0$:
$$a_0 = \frac{2}{T} \left[ \int_0^{T/2} 1 \, dt + \int_{T/2}^T (-1) \, dt \right] = \frac{2}{T} \left[ \frac{T}{2} - \frac{T}{2} \right] = 0$$

Compute $a_n$:
$$a_n = \frac{2}{T} \left[ \int_0^{T/2} \cos\left(\frac{2\pi n t}{T}\right) dt - \int_{T/2}^T \cos\left(\frac{2\pi n t}{T}\right) dt \right]$$

By symmetry and periodicity, $a_n = 0$ for all $n$ (the square wave is odd, cosines are even).

Compute $b_n$:
$$b_n = \frac{2}{T} \left[ \int_0^{T/2} \sin\left(\frac{2\pi n t}{T}\right) dt - \int_{T/2}^T \sin\left(\frac{2\pi n t}{T}\right) dt \right]$$

$$= \frac{2}{T} \left[ -\frac{T}{2\pi n} \cos\left(\frac{2\pi n t}{T}\right) \Big|_0^{T/2} + \frac{T}{2\pi n} \cos\left(\frac{2\pi n t}{T}\right) \Big|_{T/2}^T \right]$$

$$= \frac{1}{\pi n} \left[ -(\cos(\pi n) - 1) + (1 - \cos(\pi n)) \right] = \frac{1}{\pi n} \left[ 2(1 - \cos(\pi n)) \right]$$

For odd $n$: $\cos(\pi n) = -1$, so $b_n = \frac{4}{\pi n}$  
For even $n$: $\cos(\pi n) = 1$, so $b_n = 0$

Thus:
$$f(t) = \frac{4}{\pi} \left[ \sin\left(\frac{2\pi t}{T}\right) + \frac{1}{3}\sin\left(\frac{6\pi t}{T}\right) + \frac{1}{5}\sin\left(\frac{10\pi t}{T}\right) + \cdots \right]$$

**Why it works:**

The square wave is an odd function (antisymmetric about $t=0$), so it has no DC component ($a_0=0$) and no cosine terms ($a_n=0$). Only odd harmonics appear because the square wave's sharp transitions excite the fundamental and all odd multiples. The $\frac{1}{n}$ decay of coefficients reflects Gibbs's phenomenon: at the discontinuity, the finite Fourier series overshoots by ~9%, and this overshoot persists as you add more terms (it concentrates near the discontinuity but doesn't shrink).

## GATE MA Relevance

> **Why it matters in GATE MA:** Fourier series appears in 5–7% of GATE papers. Problems typically ask to (1) compute Fourier coefficients for a given periodic signal, (2) identify symmetries (even, odd, half-wave) to simplify computation, or (3) apply Parseval's theorem to relate time-domain energy to frequency-domain energy. It's foundational for signal processing, power systems (harmonic analysis), and vibration analysis.
