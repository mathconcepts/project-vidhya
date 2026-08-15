---
id: residue-calculus-worked-example
concept_id: residue-calculus
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
---

# Worked Example — Residue Theorem with Two Poles (GATE Style)

## Problem

Evaluate $\displaystyle\oint_C \frac{1}{(z-1)(z+2)}\,dz$ where $C$ is the circle $|z| = 3$ traversed counterclockwise.

---

## Step 1 — Find the Singularities

The integrand $f(z) = \dfrac{1}{(z-1)(z+2)}$ has simple poles at:

- $z_1 = 1$
- $z_2 = -2$

## Step 2 — Determine Which Poles Are Inside $C$

The contour is $|z| = 3$ (radius 3).

- $|z_1| = |1| = 1 < 3$ $\Rightarrow$ $z_1 = 1$ is **inside** $C$.
- $|z_2| = |-2| = 2 < 3$ $\Rightarrow$ $z_2 = -2$ is **inside** $C$.

Both poles lie inside $C$.

## Step 3 — Compute the Residues

**Residue at $z_1 = 1$** (simple pole):

$$\operatorname{Res}_{z=1} f(z) = \lim_{z\to 1}(z-1)\cdot\frac{1}{(z-1)(z+2)} = \lim_{z\to 1}\frac{1}{z+2} = \frac{1}{1+2} = \frac{1}{3}$$

**Residue at $z_2 = -2$** (simple pole):

$$\operatorname{Res}_{z=-2} f(z) = \lim_{z\to -2}(z+2)\cdot\frac{1}{(z-1)(z+2)} = \lim_{z\to -2}\frac{1}{z-1} = \frac{1}{-2-1} = -\frac{1}{3}$$

## Step 4 — Apply the Residue Theorem

$$\oint_C f(z)\,dz = 2\pi i \sum \operatorname{Res} = 2\pi i\left(\frac{1}{3} + \left(-\frac{1}{3}\right)\right) = 2\pi i \cdot 0 = 0$$

$$\boxed{\oint_C \frac{1}{(z-1)(z+2)}\,dz = 0}$$

---

## Interpretation

The two residues are equal in magnitude and opposite in sign. The "whirlpools" at $z=1$ and $z=-2$ spin with equal strength but in opposite senses — they cancel exactly. The net circulation is zero, even though the integrand is not analytic inside $C$.

---

## Verification via Partial Fractions

$$\frac{1}{(z-1)(z+2)} = \frac{1/3}{z-1} - \frac{1/3}{z+2}$$

$$\oint_C f\,dz = \frac{1}{3}\oint_C\frac{dz}{z-1} - \frac{1}{3}\oint_C\frac{dz}{z+2} = \frac{1}{3}(2\pi i) - \frac{1}{3}(2\pi i) = 0 \checkmark$$

---

## Common GATE Traps

- **Contour too small to include both poles**: if $C$ were $|z| = 1.5$, only $z = 1$ would be inside (since $|-2| = 2 > 1.5$), giving $2\pi i \times \frac{1}{3} = \frac{2\pi i}{3}$.
- **Higher-order poles**: for $f = 1/(z-1)^2(z+2)$, the residue at $z=1$ requires the order-2 formula: $\dfrac{d}{dz}\dfrac{1}{z+2}\big|_{z=1} = -\frac{1}{9}$.
- **Poles on the contour**: not defined — always check that poles are strictly inside or outside, never exactly on $C$.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: residue theorem for 1/[(z−1)(z+2)] on |z|=1.5","steps":[{"prompt":"For f(z) = 1/[(z−1)(z+2)], which poles lie inside the contour |z|=1.5?","hint":"Check |1|=1 vs 1.5, and |−2|=2 vs 1.5. A pole is inside if its modulus is strictly less than the radius.","answer":"Only z=1 is inside |z|=1.5, since |1|=1 < 1.5 but |−2|=2 > 1.5."},{"prompt":"Compute the residue at z=1 and then evaluate ∮_{|z|=1.5} f(z) dz.","hint":"Res at simple pole z₀ of 1/[(z−1)(z+2)] is lim_{z→1}(z−1)·f(z) = 1/(1+2) = 1/3. Then apply the residue theorem.","answer":"Res = 1/3. The integral = 2πi × (1/3) = 2πi/3."}]}
```
