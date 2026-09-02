---
id: residue-calculus.worked-example
concept_id: residue-calculus
atom_type: worked_example
bloom_level: 3
difficulty: 0.4
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** Evaluate $\displaystyle\oint_C \frac{e^z}{z^2}\,dz$ where $C$ is $|z|=2$, counterclockwise.

---

**Step 1 — Identify the pole and its order.** The only singularity is $z=0$, where the denominator vanishes to order $2$: a **pole of order 2**. $|0|=0<2$, so it's inside $C$.

---

**Step 2 — Apply the order-2 residue formula.** $\text{Res}_{z=0}f(z)=\frac1{(2-1)!}\lim_{z\to0}\frac{d}{dz}\left[z^2\cdot\frac{e^z}{z^2}\right]=\lim_{z\to0}\frac{d}{dz}\left[e^z\right]=\lim_{z\to0}e^z=e^0=1$.

---

**Step 3 — Apply the residue theorem.** $\oint_C\frac{e^z}{z^2}\,dz=2\pi i\cdot\text{Res}_{z=0}f(z)=2\pi i\cdot1=\boxed{2\pi i}$.

---

**Step 4 — Verify with the generalized Cauchy integral formula.** $f(z)=e^z$ is entire, so $f^{(n)}(0)=\frac{n!}{2\pi i}\oint_C\frac{f(z)}{z^{n+1}}\,dz$. With $n+1=2\Rightarrow n=1$: $f'(0)=\frac{1!}{2\pi i}\oint_C\frac{e^z}{z^2}\,dz$, so $\oint_C\frac{e^z}{z^2}\,dz=2\pi i\,f'(0)=2\pi i\,e^0=2\pi i$ — matches.

**Method note.** Use the order-$m$ derivative formula when the denominator's zero order at $z_0$ is finite and known (here $m=2$, from $z^2$) — not the simple-pole limit $\lim_{z\to z_0}(z-z_0)f(z)$, which for this integrand gives $\lim_{z\to0}z\cdot e^z/z^2=\lim_{z\to0}e^z/z$, a limit that doesn't exist. The simple-pole shortcut only applies when $m=1$; using it here silently produces nonsense instead of a residue.
