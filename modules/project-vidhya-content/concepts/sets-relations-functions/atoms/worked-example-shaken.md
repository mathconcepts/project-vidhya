---
id: sets-relations-functions.worked-example-shaken
concept_id: sets-relations-functions
atom_type: worked_example
variant_of: sets-relations-functions.worked-example
for_stance: shaken
bloom_level: 3
difficulty: 0.35
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** $f: \mathbb{R} - \{-3\} \to \mathbb{R} - \{1\}$, $f(x) = \dfrac{x+2}{x+3}$. Show $f$ is bijective and find $f^{-1}$.

---

**Step 1 — Try a specific pair.** Suppose $f(x_1) = f(x_2)$. Write it out: $\dfrac{x_1+2}{x_1+3} = \dfrac{x_2+2}{x_2+3}$.

---

**Step 2 — Clear the fractions.** Cross-multiply: $(x_1+2)(x_2+3) = (x_2+2)(x_1+3)$. Multiply out the left: $x_1x_2 + 3x_1 + 2x_2 + 6$. Multiply out the right: $x_1x_2 + 3x_2 + 2x_1 + 6$. Set them equal and cancel $x_1x_2$ and $6$ from both sides: $3x_1 + 2x_2 = 3x_2 + 2x_1$.

---

**Step 3 — Finish the algebra.** $3x_1 - 2x_1 = 3x_2 - 2x_2 \Rightarrow x_1 = x_2$. So $f$ is one-one — checked directly, no shortcut.

---

**Step 4 — Solve $y = f(x)$ for $x$.** $y(x+3) = x+2 \Rightarrow yx + 3y = x + 2 \Rightarrow x(y-1) = 2 - 3y \Rightarrow x = \dfrac{2-3y}{y-1}$.

---

**Step 5 — Check this is always valid.** $y \ne 1$ in the codomain, so we never divide by zero. Every $y$ gives a real $x$: $f$ is onto, hence bijective.

$$\boxed{f^{-1}(y) = \dfrac{2-3y}{y-1}}$$

**Check the answer:** plug $y = 0$ in: $f^{-1}(0) = \dfrac{2}{-1} = -2$. Now check $f(-2) = \dfrac{-2+2}{-2+3} = \dfrac{0}{1} = 0$. Matches.
