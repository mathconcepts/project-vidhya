---
# Alternative body for random-variables.worked-example, served when the
# learner stance is `assured`. See src/content/stance-variants.ts.
id: random-variables.worked-example.assured
concept_id: random-variables
atom_type: worked_example
bloom_level: 3
difficulty: 0.2
exam_ids: ["*"]
scaffold_fade: true
variant_of: random-variables.worked-example
for_stance: assured
---

Same PMF, $E[X]=2.3$, $E[X^2]=5.9$, $\boxed{\text{Var}(X)=0.61}$. The distinction worth banking: $\text{Var}(X)=E[X^2]-(E[X])^2$ is exact for *any* discrete distribution — there's no special-case shortcut for symmetric or evenly-spaced PMFs that avoids computing $E[X^2]$ separately. A tempting shortcut some students reach for — averaging the squared deviations from the *mode* instead of the mean — gives a different, wrong number, because variance is defined around $E[X]$ specifically, not around whichever value has the highest probability. Check which point a "spread" calculation is centered on before trusting it.
