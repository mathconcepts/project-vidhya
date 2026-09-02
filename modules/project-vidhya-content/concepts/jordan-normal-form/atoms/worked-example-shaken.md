---
# Alternative body for jordan-normal-form.worked-example, served when the
# learner stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence.
# Prose is held at or below the base atom's length; every step is written
# out in full with an explicit check, no praise, no reassurance.
id: jordan-normal-form.worked-example.shaken
concept_id: jordan-normal-form
atom_type: worked_example
bloom_level: 3
difficulty: 0.2
exam_ids: ["*"]
scaffold_fade: true
variant_of: jordan-normal-form.worked-example
for_stance: shaken
---

**Problem:** Jordan form of $A=\begin{pmatrix}4&1\\-1&2\end{pmatrix}$.

---

**Step 1 — Subtract $\lambda$ down the diagonal, expand the determinant.**

$$\det(A-\lambda I)=(4-\lambda)(2-\lambda)-(1)(-1)=\lambda^2-6\lambda+9$$

---

**Step 2 — Solve.**

$$\lambda^2-6\lambda+9=(\lambda-3)^2=0 \Rightarrow \lambda=3 \text{ (repeated)}$$

---

**Step 3 — Find the eigenvector.**

$$A-3I=\begin{pmatrix}1&1\\-1&-1\end{pmatrix},\quad v_1+v_2=0 \Rightarrow v=(1,-1)$$

Rank of $A-3I$ is $1$: only one independent eigenvector exists.

---

**Step 4 — Find the chain vector $w$, solving $(A-3I)w=v$.**

$$w_1+w_2=1 \Rightarrow w=(1,0)$$

---

**Step 5 — Check and assemble.**

$$Aw=\begin{pmatrix}4\\-1\end{pmatrix}=3w+v \ \checkmark$$

$$\boxed{J=\begin{pmatrix}3&1\\0&3\end{pmatrix}}$$
