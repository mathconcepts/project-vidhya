---
id: inverse-laplace-intuition
concept_id: inverse-laplace
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
---

# Inverse Laplace Transform — Intuition

## What is $\mathcal{L}^{-1}\{F(s)\}$?

The **inverse Laplace transform** recovers the time-domain function $f(t)$ from its $s$-domain representation $F(s)$.

The formal definition is the Bromwich contour integral:

$$f(t) = \mathcal{L}^{-1}\{F(s)\} = \frac{1}{2\pi j}\int_{\sigma - j\infty}^{\sigma + j\infty} F(s)\,e^{st}\,ds, \quad t \geq 0$$

In GATE problems you never evaluate this contour integral directly. Instead, every inverse Laplace problem reduces to one of three practical techniques.

---

## Technique 1 — Partial Fractions + Table Lookup

Decompose a rational $F(s)$ into recognisable fragments, then read off $f(t)$ from the standard table:

| $F(s)$ | $f(t)$, $t \geq 0$ |
|---|---|
| $\dfrac{1}{s}$ | $1$ |
| $\dfrac{1}{s^{n+1}}$ | $\dfrac{t^n}{n!}$ |
| $\dfrac{1}{s+a}$ | $e^{-at}$ |
| $\dfrac{\omega}{s^2+\omega^2}$ | $\sin\omega t$ |
| $\dfrac{s}{s^2+\omega^2}$ | $\cos\omega t$ |
| $\dfrac{\omega}{(s+a)^2+\omega^2}$ | $e^{-at}\sin\omega t$ |
| $\dfrac{s+a}{(s+a)^2+\omega^2}$ | $e^{-at}\cos\omega t$ |

**Example decomposition:**

$$\frac{A}{s+a} + \frac{Bs+C}{s^2+\omega^2} \xrightarrow{\;\mathcal{L}^{-1}\;} Ae^{-at} + B\cos\omega t + \frac{C}{\omega}\sin\omega t$$

---

## Technique 2 — Completing the Square

When the quadratic denominator has no clean factorisation over the reals, complete the square:

$$s^2 + 2as + b^2 = (s+a)^2 + (b^2 - a^2)$$

This reveals the damping constant $a$ and the damped frequency $\omega_d = \sqrt{b^2-a^2}$, and lets you match an exponentially-modulated sinusoid pair.

**Example:** $\dfrac{1}{s^2+4s+13} = \dfrac{1}{(s+2)^2+9} \xrightarrow{\;\mathcal{L}^{-1}\;} \dfrac{1}{3}e^{-2t}\sin 3t$

---

## Technique 3 — Convolution Theorem

When $F(s) = F_1(s)\cdot F_2(s)$ and partial fractions are messy:

$$\mathcal{L}^{-1}\{F_1(s)\cdot F_2(s)\} = (f_1 * f_2)(t) = \int_0^t f_1(\tau)\,f_2(t-\tau)\,d\tau$$

---

## Heaviside Expansion for Repeated Poles

For a repeated pole $s = -a$ of order 2:

$$F(s) = \frac{N(s)}{(s+a)^2\, D(s)} \implies \frac{A_1}{(s+a)^2} + \frac{A_2}{s+a} + \cdots$$

where

$$A_1 = \lim_{s \to -a}(s+a)^2 F(s), \qquad A_2 = \left.\frac{d}{ds}\left[(s+a)^2 F(s)\right]\right|_{s=-a}$$

---

## Key Principle

$\mathcal{L}^{-1}$ is linear:

$$\mathcal{L}^{-1}\{aF(s)+bG(s)\} = a\,f(t)+b\,g(t)$$

**GATE pattern recognition:** The pole structure of $F(s)$ tells you the form of $f(t)$:
- Real pole $s = -a$ $\Rightarrow$ exponential $e^{-at}$
- Imaginary poles $s = \pm j\omega$ $\Rightarrow$ sinusoid
- Complex poles $s = -a \pm j\omega$ $\Rightarrow$ damped sinusoid
- Repeated pole $\Rightarrow$ polynomial factor multiplied into the exponential ($te^{-at}$, etc.)
