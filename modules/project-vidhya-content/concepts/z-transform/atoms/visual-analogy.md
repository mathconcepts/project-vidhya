---

**FILE 3: worked-example.md**
```
---
id: z-transform.worked-example
concept_id: z-transform
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
---

# Worked Example: Solving a Difference Equation via Z-Transform

## Problem
Solve the difference equation using Z-Transform:
$$y[n] - 0.5y[n-1] = u[n]$$
where $u[n] = \delta[n]$ (unit impulse: 1 at $n=0$, 0 elsewhere) and initial condition $y[-1] = 0$.

## Solution

**Step 1: Take Z-Transform of both sides**

Apply linearity and the time-shift property $\mathcal{Z}\{y[n-1]\} = z^{-1}Y(z)$:

$$Y(z) - 0.5z^{-1}Y(z) = U(z)$$

Since $u[n] = \delta[n]$, we have $U(z) = 1$.

**Step 2: Factor out $Y(z)$**

$$Y(z)[1 - 0.5z^{-1}] = 1$$

$$Y(z) = \frac{1}{1 - 0.5z^{-1}} = \frac{z}{z - 0.5}$$

**Step 3: Inverse Z-Transform**

Recognize the standard form: $\mathcal{Z}\{a^n u[n]\} = \frac{z}{z-a}$

By inspection with $a = 0.5$:
$$y[n] = (0.5)^n u[n]$$

**Verification:** 
- $n=0$: $y[0] = (0.5)^0 = 1$
- $n=1$: $y[1] = 0.5 \cdot 1 - 0.5(1) = 0.5$ ✓ (matches $(0.5)^1$)
- $n \geq 2$: Each sample decays by factor 0.5, as expected from the pole at $z=0.5$ (inside unit circle → stable).

## Key Exam Insights

1. **Time-shift property** turns $y[n-1]$ into $z^{-1}Y(z)$—this is why Z-Transform simplifies difference equations.
2. **Partial-fraction decomposition** (when needed) recovers the time-domain sequence.
3. **Pole location** ($|z| < 1$ inside the unit circle) immediately tells you the solution is stable and decaying.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Solve y[n] - 0.5y[n-1] = δ[n]","steps":[{"prompt":"Step 1: Write the Z-Transform of both sides of y[n] - 0.5y[n-1] = δ[n]. Use the time-shift property for y[n-1].","hint":"Apply Z{·} to each term. Recall: Z{y[n-1]} = z^(-1)Y(z) and Z{δ[n]} = 1.","answer":"Y(z) - 0.5·z^(-1)·Y(z) = 1"},{"prompt":"Step 2: Solve for Y(z) by factoring.","hint":"Factor out Y(z) on the left side: Y(z)[1 - 0.5z^(-1)] = 1. Then divide.","answer":"Y(z) = 1/(1 - 0.5z^(-1)) = z/(z - 0.5)"},{"prompt":"Step 3: Identify the inverse Z-Transform. What is y[n]?","hint":"Compare with the standard form Z{a^n·u[n]} = z/(z - a). Here a = 0.5.","answer":"y[n] = (0.5)^n·u[n], meaning y[n] = (0.5)^n for n ≥ 0, and 0 for n < 0"}],"caption":"Pole at z=0.5 < 1 ensures stability: the sequence decays exponentially."}
```
```

PATH:
