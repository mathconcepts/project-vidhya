---
id: laplace-transform-intuition
concept_id: laplace-transform
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
---

# The Laplace Transform

The Laplace transform converts a time-domain function $f(t)$ into a complex-frequency-domain function $F(s)$, turning differential equations into algebraic ones.

---

## Definition

$$\mathcal{L}\{f(t)\} = F(s) = \int_0^{\infty} e^{-st}\,f(t)\,dt, \quad s \in \mathbb{C},\; \text{Re}(s) > \sigma_0$$

The transform exists when $f(t)$ is of *exponential order* — that is, $|f(t)| \leq Me^{\alpha t}$ for some $M, \alpha$. The region $\text{Re}(s) > \alpha$ is the **region of convergence (ROC)**.

---

## Essential Transform Pairs (Memorise for GATE)

| $f(t)$ | $F(s) = \mathcal{L}\{f(t)\}$ | ROC |
|---|---|---|
| $1$ (unit step) | $\dfrac{1}{s}$ | $\text{Re}(s) > 0$ |
| $t^n$ | $\dfrac{n!}{s^{n+1}}$ | $\text{Re}(s) > 0$ |
| $e^{at}$ | $\dfrac{1}{s-a}$ | $\text{Re}(s) > a$ |
| $\sin(\omega t)$ | $\dfrac{\omega}{s^2+\omega^2}$ | $\text{Re}(s) > 0$ |
| $\cos(\omega t)$ | $\dfrac{s}{s^2+\omega^2}$ | $\text{Re}(s) > 0$ |
| $e^{at}\sin(\omega t)$ | $\dfrac{\omega}{(s-a)^2+\omega^2}$ | $\text{Re}(s) > a$ |
| $e^{at}\cos(\omega t)$ | $\dfrac{s-a}{(s-a)^2+\omega^2}$ | $\text{Re}(s) > a$ |
| $\delta(t)$ (Dirac) | $1$ | all $s$ |
| $t\,e^{at}$ | $\dfrac{1}{(s-a)^2}$ | $\text{Re}(s) > a$ |

---

## Key Properties

### Linearity
$$\mathcal{L}\{af(t) + bg(t)\} = aF(s) + bG(s)$$

### First Shifting Theorem (s-shifting)
$$\mathcal{L}\{e^{at}f(t)\} = F(s - a)$$

Multiply by an exponential in $t$ → shift by $a$ in $s$.

### Differentiation in Time
$$\mathcal{L}\{f'(t)\} = sF(s) - f(0)$$

$$\mathcal{L}\{f''(t)\} = s^2F(s) - s\,f(0) - f'(0)$$

$$\mathcal{L}\{f^{(n)}(t)\} = s^n F(s) - s^{n-1}f(0) - \cdots - f^{(n-1)}(0)$$

This is the engine of the ODE-solving technique: derivatives become powers of $s$.

### Integration in Time
$$\mathcal{L}\!\left\{\int_0^t f(\tau)\,d\tau\right\} = \frac{F(s)}{s}$$

### Multiplication by $t$ (Differentiation in $s$)
$$\mathcal{L}\{t\,f(t)\} = -\frac{d}{ds}F(s)$$

More generally: $\mathcal{L}\{t^n f(t)\} = (-1)^n F^{(n)}(s)$.

### Initial and Final Value Theorems
$$f(0^+) = \lim_{s \to \infty} s\,F(s) \qquad \text{(initial value)}$$

$$\lim_{t \to \infty} f(t) = \lim_{s \to 0}\, s\,F(s) \qquad \text{(final value, if limit exists)}$$

---

## Solving ODEs with Laplace Transform

**Procedure:**

1. Apply $\mathcal{L}$ to both sides; use differentiation rules to express $\mathcal{L}\{y''\}$, $\mathcal{L}\{y'\}$ in terms of $Y(s)$ and initial conditions.
2. Solve the resulting algebraic equation for $Y(s)$.
3. Decompose $Y(s)$ using **partial fractions**.
4. Invert term by term using the table of pairs.

---

## Partial Fractions Quick Reference

| Denominator factor | Partial fraction |
|---|---|
| $(s - a)$ | $\dfrac{A}{s-a}$ |
| $(s - a)^2$ | $\dfrac{A}{s-a} + \dfrac{B}{(s-a)^2}$ |
| $(s^2 + \omega^2)$ | $\dfrac{As + B}{s^2 + \omega^2}$ |
| $(s-a)(s-b)$, $a\neq b$ | $\dfrac{A}{s-a} + \dfrac{B}{s-b}$ |

**Cover-up method:** For simple poles, multiply both sides by $(s-a)$ and set $s = a$.

---

## GATE Quick Facts

- The Laplace transform is **linear**.
- Differentiation in $t$ ↔ multiplication by $s$ (minus initial conditions).
- Integration in $t$ ↔ division by $s$.
- The inverse transform is unique for functions of exponential order.
- Convolution in time → multiplication in $s$: $\mathcal{L}\{(f * g)(t)\} = F(s)G(s)$.
