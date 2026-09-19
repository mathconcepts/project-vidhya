---
id: sets-relations-functions.worked-example
concept_id: sets-relations-functions
atom_type: worked_example
bloom_level: 3
difficulty: 0.35
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** Let $f: \mathbb{R} - \{-3\} \to \mathbb{R} - \{1\}$ be defined by $f(x) = \dfrac{x+2}{x+3}$. Show $f$ is bijective and find $f^{-1}$.

---

**Step 1 — Check one-one.** Assume two inputs give the same output: $f(x_1) = f(x_2)$, so $\dfrac{x_1+2}{x_1+3} = \dfrac{x_2+2}{x_2+3}$.

---

**Step 2 — Cross-multiply and simplify.** $(x_1+2)(x_2+3) = (x_2+2)(x_1+3)$. Expanding both sides and cancelling the matching terms leaves exactly $x_1 = x_2$ — the two inputs were never actually different. So $f$ is one-one.

---

**Step 3 — Check onto.** Let $y$ be any value in the codomain $\mathbb{R} - \{1\}$ and try to solve $y = \dfrac{x+2}{x+3}$ for $x$. Cross-multiplying: $y(x+3) = x+2 \Rightarrow x(y-1) = 2 - 3y \Rightarrow x = \dfrac{2-3y}{y-1}$.

---

**Step 4 — Confirm this always works.** Because $y \ne 1$ in the codomain, $y - 1 \ne 0$, so $x$ is always a genuine real number. Every $y$ in the codomain has a matching $x$ — $f$ is onto. One-one and onto together make $f$ bijective, so $f^{-1}$ exists.

---

**Step 5 — Read off the inverse.** The $x$ we just solved for, as a function of $y$, IS $f^{-1}$: $\boxed{f^{-1}(y) = \dfrac{2-3y}{y-1}}$.

Check: substituting $f^{-1}(y)$ back into $f$ returns $y$ exactly, confirming the inverse is correct.
