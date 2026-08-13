---
id: joint-distributions-worked-example
concept_id: joint-distributions
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
---

# GATE Problem: Joint PDF on a Triangular Region

## Problem Statement

Let $(X, Y)$ have joint PDF:

$$f(x,y) = 2, \quad 0 < x < y < 1, \qquad f(x,y) = 0 \text{ otherwise}$$

Find the **marginal PDFs** $f_X(x)$ and $f_Y(y)$, the means $E[X]$ and $E[Y]$, and the **covariance** $\text{Cov}(X, Y)$.

---

## Step 1 — Verify the Joint is Valid

$$\int_0^1 \int_0^y 2\,dx\,dy = \int_0^1 2y\,dy = \left[y^2\right]_0^1 = 1 \checkmark$$

---

## Step 2 — Marginal PDFs

**For $f_X(x)$:** Given $x$, $y$ ranges from $x$ to $1$ (since $x < y < 1$):

$$f_X(x) = \int_x^1 2\,dy = 2(1-x), \quad 0 < x < 1$$

**For $f_Y(y)$:** Given $y$, $x$ ranges from $0$ to $y$ (since $0 < x < y$):

$$f_Y(y) = \int_0^y 2\,dx = 2y, \quad 0 < y < 1$$

---

## Step 3 — Means

$$E[X] = \int_0^1 x \cdot 2(1-x)\,dx = 2\int_0^1 (x - x^2)\,dx = 2\left[\frac{x^2}{2} - \frac{x^3}{3}\right]_0^1 = 2\left(\frac{1}{2} - \frac{1}{3}\right) = \frac{1}{3}$$

$$E[Y] = \int_0^1 y \cdot 2y\,dy = 2\int_0^1 y^2\,dy = 2 \cdot \frac{1}{3} = \frac{2}{3}$$

**Sanity check:** $E[X] < E[Y]$ is expected since $X < Y$ always.

---

## Step 4 — Compute $E[XY]$

Integrate over the triangular region:

$$E[XY] = \int_0^1 \int_0^y 2xy\,dx\,dy = \int_0^1 2y \cdot \frac{x^2}{2}\bigg|_0^y dy = \int_0^1 y \cdot y^2\,dy = \int_0^1 y^3\,dy = \frac{1}{4}$$

---

## Step 5 — Covariance

$$\text{Cov}(X,Y) = E[XY] - E[X]\,E[Y] = \frac{1}{4} - \frac{1}{3} \cdot \frac{2}{3} = \frac{1}{4} - \frac{2}{9}$$

$$= \frac{9}{36} - \frac{8}{36} = \boxed{\frac{1}{36}}$$

**Positive covariance confirms:** since $X < Y$ always, larger values of $Y$ permit (and in fact force) larger values of $X$, creating positive dependence.

---

## Summary Table

| Quantity | Value |
|---|---|
| $E[X]$ | $\dfrac{1}{3}$ |
| $E[Y]$ | $\dfrac{2}{3}$ |
| $E[XY]$ | $\dfrac{1}{4}$ |
| $\text{Cov}(X,Y)$ | $\dfrac{1}{36}$ |

**GATE tip:** Always identify the support region first and set correct integration limits — the most common error in joint distribution problems is integrating $x$ from 0 to 1 ignoring the constraint $x < y$.

---

```interactive-spec
{"v":1,"kind":"guided_walkthrough","steps":[{"prompt":"For the same joint PDF f(x,y) = 2, 0 < x < y < 1, compute Var(X) using Var(X) = E[X²] − (E[X])². You already know E[X] = 1/3.","hint":"Find E[X²] = ∫₀¹ x² · 2(1−x) dx. Expand: 2∫₀¹ (x² − x³) dx. Then Var(X) = E[X²] − (1/3)².","answer":"E[X²] = 2∫₀¹(x² − x³)dx = 2[x³/3 − x⁴/4]₀¹ = 2(1/3 − 1/4) = 2·(1/12) = 1/6. Var(X) = 1/6 − (1/3)² = 1/6 − 1/9 = 3/18 − 2/18 = 1/18."},{"prompt":"Are X and Y independent? Give a definitive one-sentence reason without computing the correlation.","hint":"Check whether f(x,y) = f_X(x) · f_Y(y). Also consider the support region — can the domain of X be described without reference to Y?","answer":"X and Y are NOT independent. The support domain 0 < x < y < 1 is triangular — the range of X depends on the value of Y — so the joint can never be factored as a product of marginals. Independence requires a rectangular support domain."}]}
```
