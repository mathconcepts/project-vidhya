---
id: inverse-laplace-worked-example
concept_id: inverse-laplace
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
---

# Inverse Laplace Transform — Worked Example

## Problem (GATE style)

Find $\mathcal{L}^{-1}\!\left\{\dfrac{s+2}{(s+1)(s^2+4)}\right\}$.

---

## Step 1 — Set Up Partial Fractions

The denominator has a distinct linear factor $(s+1)$ and an irreducible quadratic $(s^2+4)$, so write:

$$\frac{s+2}{(s+1)(s^2+4)} = \frac{A}{s+1} + \frac{Bs+C}{s^2+4}$$

Multiply both sides by $(s+1)(s^2+4)$:

$$s+2 = A(s^2+4) + (Bs+C)(s+1)$$

---

## Step 2 — Solve for the Coefficients

**Find $A$** by substituting $s = -1$ (the root of the linear factor):

$$(-1)+2 = A\bigl((-1)^2+4\bigr) \implies 1 = 5A \implies \boxed{A = \tfrac{1}{5}}$$

**Find $B$ and $C$** by expanding the right side and equating powers of $s$:

$$s+2 = (A+B)s^2 + (B+C)s + (4A+C)$$

| Power | Equation | Result |
|---|---|---|
| $s^2$ | $A + B = 0$ | $B = -\tfrac{1}{5}$ |
| $s^1$ | $B + C = 1$ | $C = 1 + \tfrac{1}{5} = \tfrac{6}{5}$ |
| $s^0$ | $4A + C = 2$ | Check: $\tfrac{4}{5}+\tfrac{6}{5} = 2$ ✓ |

The partial fraction decomposition is:

$$\frac{s+2}{(s+1)(s^2+4)} = \frac{1/5}{s+1} + \frac{-s/5 + 6/5}{s^2+4}$$

---

## Step 3 — Align with Standard Table Pairs

The term $\dfrac{-s/5 + 6/5}{s^2+4}$ must be split to match $\dfrac{s}{s^2+\omega^2}$ and $\dfrac{\omega}{s^2+\omega^2}$ with $\omega = 2$:

$$\frac{-s/5 + 6/5}{s^2+4} = -\frac{1}{5}\cdot\frac{s}{s^2+4} + \frac{3}{5}\cdot\frac{2}{s^2+4}$$

(Note: $\dfrac{6/5}{s^2+4} = \dfrac{3}{5}\cdot\dfrac{2}{s^2+4}$ to extract the $\omega = 2$ factor needed for the sine pair.)

---

## Step 4 — Apply Inverse Laplace Table

Using $\mathcal{L}^{-1}\!\left\{\tfrac{1}{s+a}\right\}=e^{-at}$, $\;\mathcal{L}^{-1}\!\left\{\tfrac{s}{s^2+\omega^2}\right\}=\cos\omega t$, $\;\mathcal{L}^{-1}\!\left\{\tfrac{\omega}{s^2+\omega^2}\right\}=\sin\omega t$:

$$f(t) = \frac{1}{5}e^{-t} - \frac{1}{5}\cos 2t + \frac{3}{5}\sin 2t, \quad t \geq 0$$

---

## Answer

$$\boxed{f(t) = \frac{1}{5}e^{-t} - \frac{1}{5}\cos 2t + \frac{3}{5}\sin 2t, \quad t \geq 0}$$

**Sanity check — pole structure:**

| Pole location | Type | Contribution to $f(t)$ |
|---|---|---|
| $s = -1$ (real, simple) | exponential decay | $\tfrac{1}{5}e^{-t}$ |
| $s = \pm 2j$ (imaginary pair) | pure oscillation | $-\tfrac{1}{5}\cos 2t + \tfrac{3}{5}\sin 2t$ |

All poles have non-positive real parts, so $f(t) \to 0$ as $t \to \infty$ (the system is stable). The answer is consistent.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","steps":[{"prompt":"Set up the partial fraction decomposition for (s+2) / [(s+1)(s²+4)]. What form do you write, and what is the value of A?","hint":"The linear factor (s+1) contributes A/(s+1). The irreducible quadratic (s²+4) contributes (Bs+C)/(s²+4). To find A, substitute s = −1 into both sides after multiplying through by (s+1)(s²+4).","answer":"Write A/(s+1) + (Bs+C)/(s²+4). Setting s = −1 gives 1 = A·5, so A = 1/5. Equating s² coefficients gives B = −1/5; equating s¹ coefficients gives C = 6/5."},{"prompt":"Rewrite the partial fractions in standard table form and state f(t).","hint":"Split (−s/5 + 6/5)/(s²+4) into −(1/5)·s/(s²+4) plus (3/5)·2/(s²+4) to match the cosine and sine table pairs with ω = 2.","answer":"f(t) = (1/5)e^{−t} − (1/5)cos(2t) + (3/5)sin(2t) for t ≥ 0."}]}
```
