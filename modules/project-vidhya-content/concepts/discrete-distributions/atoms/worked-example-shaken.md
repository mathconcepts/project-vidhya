---
# Alternative body for discrete-distributions.worked-example, served when
# the learner stance is `shaken`. See src/content/stance-variants.ts.
id: discrete-distributions.worked-example.shaken
concept_id: discrete-distributions
atom_type: worked_example
bloom_level: 3
difficulty: 0.2
exam_ids: ["*"]
scaffold_fade: true
variant_of: discrete-distributions.worked-example
for_stance: shaken
---

**Problem.** $p=0.3$ pass probability, $n=5$ components. Probability exactly 2 pass?

---

**Step 1 — Choose which 2 of the 5 pass.** $\binom{5}{2}=10$ ways.

---

**Step 2 — Multiply by the pass probability, twice.** $(0.3)^2 = 0.09$.

---

**Step 3 — Multiply by the fail probability, three times (the other 3 components).** $(0.7)^3 = 0.343$.

---

**Step 4 — Multiply all three together.**
$10 \times 0.09 = 0.9$
$0.9 \times 0.343 = 0.3087$
$$\boxed{P(X=2)=0.3087}$$

**Check.** All 6 possible outcomes ($k=0$ to $5$) should sum to 1: $0.168+0.360+0.309+0.132+0.028+0.002 \approx 1.00$ ✓.
