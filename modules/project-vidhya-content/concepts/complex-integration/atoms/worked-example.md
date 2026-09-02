---
id: complex-integration.worked-example
concept_id: complex-integration
atom_type: worked_example
bloom_level: 3
difficulty: 0.4
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** Evaluate $\displaystyle\oint_C \frac{z}{z^2 - 1}\,dz$ where $C$ is the circle $|z| = 2$, counterclockwise.

---

**Step 1 — Factor the denominator.** $\dfrac{z}{z^2-1}=\dfrac{z}{(z-1)(z+1)}$, simple poles at $z=1$ and $z=-1$.

---

**Step 2 — Check which poles are inside $C$.** $|1|=1<2$ and $|-1|=1<2$: **both** poles are inside. A single-pole Cauchy formula can't be applied directly to either term until they're separated.

---

**Step 3 — Partial fractions.** $\dfrac{z}{(z-1)(z+1)}=\dfrac{A}{z-1}+\dfrac{B}{z+1}$. Clearing denominators: $z=A(z+1)+B(z-1)$. At $z=1$: $1=2A\Rightarrow A=\tfrac12$. At $z=-1$: $-1=-2B\Rightarrow B=\tfrac12$.

---

**Step 4 — Apply Cauchy's formula to each piece and add.** $\oint_C\frac{dz}{z-z_0}=2\pi i$ for any $z_0$ strictly inside $C$, so
$$\oint_C\frac{z}{z^2-1}\,dz=\frac12(2\pi i)+\frac12(2\pi i)=\boxed{2\pi i}$$

**Check (preview of residue calculus):** $2\pi i\sum\text{Res}=2\pi i\left(\tfrac12+\tfrac12\right)=2\pi i$ — same answer, same partial-fraction coefficients doing double duty as residues.

**Method note.** With two or more poles inside $C$, split by partial fractions and apply the single-pole formula to each piece — reaching for the single-pole formula on the un-split integrand (treating $z/(z^2-1)$ as if it had one $z_0$) is the error that costs the mark; the formula is stated for exactly one interior singularity at a time.
