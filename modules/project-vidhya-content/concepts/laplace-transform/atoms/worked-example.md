---
id: laplace-transform-worked-example
concept_id: laplace-transform
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
---

# Worked Example: Solving an ODE with the Laplace Transform

**GATE-style problem:** Solve the initial value problem

$$y'' + 3y' + 2y = 0, \qquad y(0) = 1,\quad y'(0) = 0$$

using the Laplace transform method.

---

## Step 1 — Take the Laplace Transform of Both Sides

Apply $\mathcal{L}$ to each term, using the differentiation rules:

$$\mathcal{L}\{y''\} = s^2 Y(s) - s\,y(0) - y'(0)$$

$$\mathcal{L}\{y'\} = s\,Y(s) - y(0)$$

$$\mathcal{L}\{y\} = Y(s)$$

Substituting initial conditions $y(0) = 1$, $y'(0) = 0$:

$$\bigl[s^2 Y - s(1) - 0\bigr] + 3\bigl[s Y - 1\bigr] + 2Y = 0$$

$$s^2 Y - s + 3sY - 3 + 2Y = 0$$

$$Y(s)\bigl(s^2 + 3s + 2\bigr) = s + 3$$

---

## Step 2 — Solve for $Y(s)$

$$Y(s) = \frac{s + 3}{s^2 + 3s + 2}$$

Factor the denominator:

$$s^2 + 3s + 2 = (s+1)(s+2)$$

$$Y(s) = \frac{s + 3}{(s+1)(s+2)}$$

---

## Step 3 — Partial Fraction Decomposition

Write:

$$\frac{s+3}{(s+1)(s+2)} = \frac{A}{s+1} + \frac{B}{s+2}$$

**Cover-up method:**

$$A = \frac{s+3}{s+2}\Bigg|_{s=-1} = \frac{-1+3}{-1+2} = \frac{2}{1} = 2$$

$$B = \frac{s+3}{s+1}\Bigg|_{s=-2} = \frac{-2+3}{-2+1} = \frac{1}{-1} = -1$$

Therefore:

$$Y(s) = \frac{2}{s+1} - \frac{1}{s+2}$$

---

## Step 4 — Invert Using Transform Pairs

Using $\mathcal{L}^{-1}\!\left\{\dfrac{1}{s+a}\right\} = e^{-at}$:

$$\boxed{y(t) = 2e^{-t} - e^{-2t}, \quad t \geq 0}$$

---

## Step 5 — Verify Initial Conditions

$$y(0) = 2e^{0} - e^{0} = 2 - 1 = 1 \quad \checkmark$$

$$y'(t) = -2e^{-t} + 2e^{-2t}$$

$$y'(0) = -2 + 2 = 0 \quad \checkmark$$

**Verification against the ODE itself:**

$$y''(t) = 2e^{-t} - 4e^{-2t}$$

$$y'' + 3y' + 2y = (2e^{-t} - 4e^{-2t}) + 3(-2e^{-t} + 2e^{-2t}) + 2(2e^{-t} - e^{-2t})$$

$$= e^{-t}(2 - 6 + 4) + e^{-2t}(-4 + 6 - 2) = 0 + 0 = 0 \quad \checkmark$$

This holds identically in $t$, not just at $t=0$ — the coefficient of each exponential term vanishes on its own, which is the real check.

---

## Physical Interpretation

The roots of $s^2 + 3s + 2 = 0$ are $s = -1$ and $s = -2$ — both real and negative, so the system is **overdamped**: no oscillations, pure exponential decay to zero. The faster mode $e^{-2t}$ dies first; the slower $e^{-t}$ dominates for large $t$.

---

## GATE Tips

| Task | Key formula |
|---|---|
| Transform $y''$ | $s^2Y - sy(0) - y'(0)$ |
| Transform $y'$ | $sY - y(0)$ |
| Simple poles | Cover-up: $A = \lim_{s\to s_0}(s-s_0)F(s)$ |
| Repeated pole $(s-a)^2$ | $\mathcal{L}^{-1}\{1/(s-a)^2\} = te^{at}$ |
| Complex poles $(s-a)^2+\omega^2$ | $\mathcal{L}^{-1}\{\omega/[(s-a)^2+\omega^2]\} = e^{at}\sin(\omega t)$ |

**Common GATE error:** Forgetting to include initial-condition terms when transforming $y'$ and $y''$. Always write $s^2Y - sy(0) - y'(0)$, not just $s^2Y$.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: solving y'' + 3y' + 2y = 0 via Laplace transform","steps":[{"prompt":"Apply the Laplace transform to y'' + 3y' + 2y = 0 with y(0)=1 and y'(0)=0. What algebraic equation do you get for Y(s)?","hint":"Use L{y''} = s²Y − s·y(0) − y'(0) = s²Y − s, and L{y'} = sY − y(0) = sY − 1. Collect all Y(s) terms on the left.","answer":"(s² + 3s + 2)Y(s) = s + 3"},{"prompt":"Factor the denominator and decompose Y(s) = (s+3)/((s+1)(s+2)) into partial fractions A/(s+1) + B/(s+2). Find A and B.","hint":"Cover-up: set s = −1 to find A, set s = −2 to find B. A = (−1+3)/(−1+2) = 2. B = (−2+3)/(−2+1) = −1.","answer":"A = 2, B = −1; so Y(s) = 2/(s+1) − 1/(s+2)"},{"prompt":"Invert Y(s) = 2/(s+1) − 1/(s+2) to obtain y(t), and verify both initial conditions.","hint":"Use L⁻¹{1/(s+a)} = e^(−at). Check y(0) = 2·1 − 1·1 and y'(0) = 2·(−1) + 1·(−1)·(−1) ... compute y'(t) = −2e^(−t) + 2e^(−2t).","answer":"y(t) = 2e^(−t) − e^(−2t); y(0) = 2 − 1 = 1 ✓, y'(0) = −2 + 2 = 0 ✓"}]}
```
