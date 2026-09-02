---
id: conformal-mapping.worked-example
concept_id: conformal-mapping
atom_type: worked_example
bloom_level: 3
difficulty: 0.4
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** Show that $f(z) = z + \frac{1}{z}$ (the Joukowski transformation) is conformal everywhere except at $z = 0$ and $z = \pm 1$.

---

**Step 1 — Check analyticity.** $z$ is entire; $\frac1z$ is analytic except at $z=0$ (a simple pole there). So $f$ is analytic on $\mathbb{C}\setminus\{0\}$ — one point excluded already.

---

**Step 2 — Compute the derivative.** $f'(z)=\dfrac{d}{dz}\left(z+\dfrac1z\right)=1-\dfrac1{z^2}$.

---

**Step 3 — Solve $f'(z)=0$.** $1-\dfrac1{z^2}=0\Rightarrow z^2=1\Rightarrow z=\pm1$. At these points $f$ is analytic, but conformality still fails: angles are not preserved locally because the magnification factor $|f'(z)|$ becomes zero and the local map collapses.

---

**Step 4 — Combine.** Excluded: $z=0$ (not analytic), $z=\pm1$ ($f'=0$). Everywhere else, $\boxed{f \text{ is conformal on } \mathbb{C}\setminus\{0,1,-1\}}$.

**Method note.** Checking only "is $f$ analytic" here would wrongly pass $z=\pm1$ — the correct test is analytic **and** $f'\neq0$, and this problem is built precisely to need both halves. The Joukowski map's practical domain, $|z|>1$, sits entirely outside all three excluded points, which is exactly why it's the standard choice for mapping circles to airfoil profiles.
