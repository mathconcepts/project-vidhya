---
# Alternative body for matrix-norms.worked-example, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence.
# Prose is held at or below the base atom's length; every step is written
# out in full with an explicit check, no praise, no reassurance.
id: matrix-norms.worked-example.shaken
concept_id: matrix-norms
atom_type: worked_example
bloom_level: 3
difficulty: 0.2
exam_ids: ["*"]
scaffold_fade: true
variant_of: matrix-norms.worked-example
for_stance: shaken
---

**Problem:** $\|A\|_F$, $\|A\|_1$, $\kappa_2(A)$ for $A=\begin{pmatrix}4&1\\0&2\end{pmatrix}$.

---

**Step 1 — square, add, root.**

$$\|A\|_F=\sqrt{4^2+1^2+0^2+2^2}=\sqrt{21}\approx4.58$$

---

**Step 2 — column sums, take the max.**

Column 1: $4+0=4$. Column 2: $1+2=3$. $\|A\|_1=\max(4,3)=4$.

---

**Step 3 — form $A^TA$, find eigenvalues.**

$$A^TA=\begin{pmatrix}16&4\\4&5\end{pmatrix}, \quad (16-\lambda)(5-\lambda)-16=\lambda^2-21\lambda+64=0$$

$$\lambda=\frac{21\pm\sqrt{185}}{2}\approx17.30,\ 3.70$$

Check: $17.30+3.70=21=\operatorname{tr}(A^TA)$ ✓, $17.30\times3.70\approx64=\det(A^TA)$ ✓.

---

**Step 4 — root, divide.**

$$\sigma_1\approx\sqrt{17.30}\approx4.16, \quad \sigma_2\approx\sqrt{3.70}\approx1.92$$

$$\boxed{\|A\|_F\approx4.58,\ \|A\|_1=4,\ \kappa_2(A)=\sigma_1/\sigma_2\approx2.16}$$
