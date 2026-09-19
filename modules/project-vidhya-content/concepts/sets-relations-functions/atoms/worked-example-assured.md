---
id: sets-relations-functions.worked-example-assured
concept_id: sets-relations-functions
atom_type: worked_example
variant_of: sets-relations-functions.worked-example
for_stance: assured
bloom_level: 3
difficulty: 0.35
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** $f: \mathbb{R} - \{-3\} \to \mathbb{R} - \{1\}$, $f(x) = \dfrac{x+2}{x+3}$. Show $f$ is bijective and find $f^{-1}$.

---

**Step 1 — One-one, quickly.** $f(x_1)=f(x_2)$ cross-multiplies to $x_1 = x_2$ directly — no extraneous case survives, so injectivity holds on the whole restricted domain.

---

**Step 2 — Onto, by solving for $x$.** $y = \dfrac{x+2}{x+3} \Rightarrow x = \dfrac{2-3y}{y-1}$, defined for every $y \ne 1$.

$$\boxed{f^{-1}(y) = \dfrac{2-3y}{y-1}}$$

---

**Why the restrictions on domain and codomain are not optional.** Drop them and declare $f: \mathbb{R} \to \mathbb{R}$ instead, and the whole argument collapses on both ends. At $x = -3$, $f$ isn't even defined — the domain restriction isn't decoration, it's what makes $f$ a function at all. And $y = 1$ is never reached by any real $x$ (the solved formula for $x$ divides by $y - 1$), so declaring the codomain to be all of $\mathbb{R}$ makes $f$ fail to be onto. Restricting the codomain to exactly the range is what turns "onto its restricted codomain" into a true statement instead of a false one about the full real line. The lesson: bijectivity is a claim about a *specific* domain-codomain pair, not a property of the formula alone — the same rule $\frac{x+2}{x+3}$ is bijective on one pair and neither injective-claim-worthy nor surjective on another.
