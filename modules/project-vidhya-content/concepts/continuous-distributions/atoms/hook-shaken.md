---
# Alternative body for continuous-distributions.hook, served when the
# learner stance is `shaken`. See src/content/stance-variants.ts.
id: continuous-distributions.hook.shaken
concept_id: continuous-distributions
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: continuous-distributions.hook
for_stance: shaken
---

"Exam scores are normal, mean 50, spread 10."

$P(X=62)$ for a continuous variable is always exactly 0 — no single point carries probability.

What you can compute is a range: $P(40 < X < 70)$, using

$$z = \frac{x-\mu}{\sigma}$$

Normal, Exponential, Uniform, Gamma — four curves, four different area-under-the-curve stories.
