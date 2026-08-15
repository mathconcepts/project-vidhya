---
id: complex-integration-worked-example
concept_id: complex-integration
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
---

# Worked Example — Contour Integral via Cauchy's Formula (GATE Style)

## Problem

Evaluate $\displaystyle\oint_C \frac{z}{z^2 - 1}\,dz$ where $C$ is the circle $|z| = 2$ traversed counterclockwise.

---

## Step 1 — Factorise the Denominator

$$\frac{z}{z^2 - 1} = \frac{z}{(z-1)(z+1)}$$

The integrand has **simple poles** at $z = 1$ and $z = -1$.

## Step 2 — Identify Poles Inside $C$

The contour is $|z| = 2$ (radius 2, centred at origin).

- $|1| = 1 < 2$ $\Rightarrow$ $z = 1$ is **inside** $C$.
- $|-1| = 1 < 2$ $\Rightarrow$ $z = -1$ is **inside** $C$.

**Both poles lie inside the contour.** We cannot directly apply the single-pole Cauchy formula — we use **partial fractions** to split the integral.

## Step 3 — Partial Fraction Decomposition

$$\frac{z}{(z-1)(z+1)} = \frac{A}{z-1} + \frac{B}{z+1}$$

Multiply both sides by $(z-1)(z+1)$:

$$z = A(z+1) + B(z-1)$$

Set $z = 1$: $1 = 2A \Rightarrow A = \tfrac{1}{2}$.
Set $z = -1$: $-1 = -2B \Rightarrow B = \tfrac{1}{2}$.

$$\frac{z}{z^2-1} = \frac{1/2}{z-1} + \frac{1/2}{z+1}$$

## Step 4 — Apply Cauchy's Integral Formula to Each Term

By Cauchy's integral formula, for any $z_0$ inside $C$:

$$\oint_C \frac{1}{z - z_0}\,dz = 2\pi i$$

Therefore:

$$\oint_C \frac{z}{z^2-1}\,dz = \frac{1}{2}\oint_C\frac{dz}{z-1} + \frac{1}{2}\oint_C\frac{dz}{z+1} = \frac{1}{2}(2\pi i) + \frac{1}{2}(2\pi i) = 2\pi i$$

$$\boxed{\oint_C \frac{z}{z^2-1}\,dz = 2\pi i}$$

---

## Alternative: Residue Theorem (Preview)

The result equals $2\pi i \times \sum \text{Res}$. The residues are $\frac{1}{2}$ at each pole, so the sum is $2 \times \frac{1}{2} = 1$, giving $2\pi i \times 1 = 2\pi i$. Consistent.

---

## Common GATE Traps

- **Forgetting to check which poles are inside the contour**: if the contour were $|z| = 0.5$, there would be no poles inside and the integral would be 0.
- **Sign errors with partial fractions**: always verify by substituting a test value.
- **Missing the $2\pi i$ factor**: the Cauchy formula gives $2\pi i \cdot f(z_0)$, not just $f(z_0)$.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: applying Cauchy's integral formula to contour poles","steps":[{"prompt":"Evaluate ∮_C 1/(z−2) dz where C is |z|=3 (counterclockwise). Is z=2 inside C?","hint":"Check |2| = 2 < 3. If the pole is inside, apply Cauchy's integral formula ∮ dz/(z−z₀) = 2πi.","answer":"Yes, |2|=2 < 3 so z=2 is inside C. By Cauchy's formula, ∮ dz/(z−2) = 2πi."},{"prompt":"Now evaluate ∮_C 1/(z−5) dz where C is still |z|=3. Is z=5 inside C?","hint":"Check |5|=5 > 3. If the singularity is outside the contour and f is analytic inside, Cauchy's theorem applies.","answer":"No, |5|=5 > 3 so z=5 is outside C. Since 1/(z−5) is analytic inside |z|=3, ∮ dz/(z−5) = 0."}]}
```
