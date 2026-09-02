---
id: taylor-laurent.worked-example
concept_id: taylor-laurent
atom_type: worked_example
bloom_level: 3
difficulty: 0.4
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** Find the Laurent series of $f(z) = \frac{z}{(z-1)(z-2)}$ valid in the annulus $1 < |z| < 2$, and classify the singularity visible in it.

---

**Step 1 — Partial fractions.** $\dfrac{z}{(z-1)(z-2)}=\dfrac{A}{z-1}+\dfrac{B}{z-2}$. Clearing denominators: $z=A(z-2)+B(z-1)$. At $z=1$: $1=-A\Rightarrow A=-1$. At $z=2$: $2=B\Rightarrow B=2$. So $f(z)=\dfrac{-1}{z-1}+\dfrac{2}{z-2}$.

---

**Step 2 — Expand each term for this annulus.** Since $|z|>1$: $\dfrac{-1}{z-1}=\dfrac{-1}{z}\cdot\dfrac1{1-1/z}=\sum_{n=1}^\infty\dfrac{-1}{z^n}$ — all negative powers. Since $|z|<2$: $\dfrac{2}{z-2}=-\sum_{n=0}^\infty\dfrac{z^n}{2^n}$ — all non-negative powers.

---

**Step 3 — Combine.** $f(z)=\sum_{n=1}^\infty\dfrac{-1}{z^n}-\sum_{n=0}^\infty\dfrac{z^n}{2^n}=\cdots-\dfrac1{z^2}-\dfrac1z-1-\dfrac z2-\dfrac{z^2}4-\cdots$

---

**Step 4 — Classify.** The principal part has exactly **one** negative power, $-1/z$: this is a series centered at $z=0$, and $0$ itself isn't a singularity of $f$ at all — the visible pole this expansion is tracking is $z=1$, which sits at the annulus's inner edge. Re-centering the same partial-fraction piece $\frac{-1}{z-1}$ directly at $z=1$ shows a **simple pole**, residue $a_{-1}=-1$. $z=2$ doesn't appear in this annulus's expansion at all — expanding instead for $|z|>2$ would show it as a simple pole with residue $+2$.

$$\boxed{\text{simple pole at } z=1,\ \text{Res}=-1;\ \text{simple pole at } z=2 \text{ (visible in a different annulus)},\ \text{Res}=+2}$$
