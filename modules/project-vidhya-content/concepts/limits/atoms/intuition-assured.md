---
# Alternative body for limits.intuition, served when the learner stance is
# `assured`. Assumes the one-sided-limits picture; spends words on the
# distinction that costs marks.
id: limits.intuition.assured
concept_id: limits
atom_type: intuition
bloom_level: 2
difficulty: 0.1
exam_ids: ["*"]
variant_of: limits.intuition
for_stance: assured
---

The distinction worth the marks: "the limit exists" and "the function is continuous there" are not the same claim, and treating them as interchangeable costs marks on classification questions specifically. A removable hole has a perfectly real, finite limit — the graph's two sides genuinely agree — while the function itself is discontinuous at that exact point, because $f(a)$ is either undefined or set to the wrong value.

So a limit question and a continuity question can share every piece of algebra and still have different answers: "find $\lim_{x\to a}f(x)$" only ever needs the two one-sided approaches to agree; "is $f$ continuous at $a$" additionally needs that shared value to equal $f(a)$ itself — a separate check the limit computation alone never performs.
