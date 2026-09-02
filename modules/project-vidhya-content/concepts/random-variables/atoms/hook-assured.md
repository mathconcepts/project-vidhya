---
# Alternative body for random-variables.hook, served when the learner
# stance is `assured`. See src/content/stance-variants.ts.
id: random-variables.hook.assured
concept_id: random-variables
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: random-variables.hook
for_stance: assured
---

You already sum $x\cdot P(x)$ without thinking. The habit that costs marks under pressure: $\text{Var}(X)=E[X^2]-(E[X])^2$, not $E\big[(X^2-X)\big]$ or $\big(E[X^2]-E[X]\big)^2$. Compute $E[X^2]$ and $E[X]$ as two separate sums over the *same* PMF, square only the second, then subtract. A variance that comes out negative is a sign the squaring happened on the wrong side of the subtraction, not a sign the distribution is unusual.
