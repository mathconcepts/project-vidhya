---
# Alternative body for series.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: series.hook.assured
concept_id: series
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: series.hook
for_stance: assured
---

"Test $\sum a_n$ for convergence" is GATE's standard prompt, and the recurring error is treating $a_n\to0$ as proof of convergence rather than a mere necessary condition. The harmonic series $\sum\frac1n$ has $a_n\to0$ and still diverges — the $n$-th term test can only ever prove divergence (when $a_n\not\to0$), never convergence; concluding convergence from $a_n\to0$ alone answers a different, false theorem.
