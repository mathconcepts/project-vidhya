---
# Alternative body for series.hook, served when the learner stance is
# `assured`. Assumes the geometric-series arithmetic; spends its words on
# the distinction that costs marks instead of re-deriving it.
id: series.hook.assured
concept_id: series
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: series.hook
for_stance: assured
---

$\sum \frac1{2^n}\to 1$ is old news. What actually costs marks: a series converging requires its **terms** to shrink to $0$, but that alone never *proves* convergence — it only rules out the alternative. $\sum \dfrac1n$ has terms shrinking to $0$ and still diverges. What actually decides convergence is the behavior of the **partial sums** as a sequence in their own right — a series is that sequence, wearing a plus-sign disguise. Any test you apply (ratio, comparison, integral) is really a shortcut for predicting whether *that* sequence has a limit, without computing the sequence term by term.
