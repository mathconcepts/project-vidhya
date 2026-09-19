---
id: quadratic-equations.worked-example-assured
concept_id: quadratic-equations
atom_type: worked_example
variant_of: quadratic-equations.worked-example
for_stance: assured
bloom_level: 3
difficulty: 0.45
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** Find all $k$ for which $2x^2+kx-5=0$ and $x^2-3x-4=0$ have a common root.

---

**Step 1 — The factorable equation pins down the candidates.** $x^2-3x-4=(x-4)(x+1)$, so any common root is $4$ or $-1$ — nothing else is possible.

---

**Step 2 — Substitute each candidate.** $x=4$ gives $32+4k-5=0 \Rightarrow k=-\dfrac{27}{4}$. $x=-1$ gives $2-k-5=0 \Rightarrow k=-3$.

$$\boxed{k=-3 \text{ or } k=-\dfrac{27}{4}}$$

---

**Why substitution beats the general common-root formula here.** The condition $(c_1a_2-c_2a_1)^2=(a_1b_2-a_2b_1)(b_1c_2-b_2c_1)$ always works, but it treats $k$ as an unknown symbol throughout and produces an equation *in $k$* that still has to be solved — extra algebra for no extra insight, when one of the two quadratics already factors cleanly. Reach for the general formula only when **neither** quadratic factors nicely; when one does, find its roots first and substitute, exactly as above.

A genuinely easy mistake here is checking only one case and stopping — "$k=-3$ works" is true but incomplete, since $x=4$ being the shared root is an entirely separate, equally valid scenario that a one-case check would silently miss. Both roots of the fixed equation are live candidates until each is individually ruled in or out.
