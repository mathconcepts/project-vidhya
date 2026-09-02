---
# Alternative body for continuous-distributions.worked-example, served
# when the learner stance is `shaken`. See src/content/stance-variants.ts.
id: continuous-distributions.worked-example.shaken
concept_id: continuous-distributions
atom_type: worked_example
bloom_level: 3
difficulty: 0.2
exam_ids: ["*"]
scaffold_fade: true
variant_of: continuous-distributions.worked-example
for_stance: shaken
---

**Problem.** $X\sim N(50,100)$. Find $P(40<X<70)$.

---

**Step 1 — Convert 40 to a $z$-score.** $z_1 = (40-50)/10 = -1$.

---

**Step 2 — Convert 70 to a $z$-score.** $z_2 = (70-50)/10 = 2$.

---

**Step 3 — Look up $\Phi(2)$.** $\Phi(2) = 0.9772$.

---

**Step 4 — Look up $\Phi(-1)$.** $\Phi(-1) = 1-\Phi(1) = 1-0.8413 = 0.1587$.

---

**Step 5 — Take the difference.**
$$\boxed{0.9772 - 0.1587 = 0.8186}$$

**Check.** The range covers 1 standard deviation below the mean to 2 above — most of the curve's area, so a result near $0.82$ makes sense; a result near $0.05$ or $0.99$ would signal a sign error in Step 4.
