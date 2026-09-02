---
# Alternative body for random-variables.intuition, served when the learner
# stance is `assured`. See src/content/stance-variants.ts.
id: random-variables.intuition.assured
concept_id: random-variables
atom_type: intuition
bloom_level: 2
difficulty: 0.15
exam_ids: ["*"]
variant_of: random-variables.intuition
for_stance: assured
---

$\text{Var}(X)=E[X^2]-(E[X])^2$ isn't a shortcut bolted onto the definition — expand $E[(X-E[X])^2] = E[X^2] - 2E[X]E[X] + (E[X])^2 = E[X^2]-(E[X])^2$ using linearity of expectation, and the two are identical. The distinction that costs marks: $E[X^2]$ is computed from the *same* PMF as $E[X]$, summing $x^2 P(x)$ — it is not $\big(\sum xP(x)\big)^2$, and it is never smaller than $(E[X])^2$ (that would make variance negative, which is impossible). A negative "variance" in your working is proof of an arithmetic error, not an unusual distribution.
