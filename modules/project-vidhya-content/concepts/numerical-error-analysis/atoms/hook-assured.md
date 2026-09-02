---
# Alternative body for numerical-error-analysis.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: numerical-error-analysis.hook.assured
concept_id: numerical-error-analysis
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: numerical-error-analysis.hook
for_stance: assured
---

$E_a(pq)\approx|p|\,\delta q+|q|\,\delta p$ is a first-order approximation, trustworthy only while $\delta p/p$ and $\delta q/q$ stay small. Push it: $p=2\pm1$, $q=3\pm1$ gives $E_a(pq)\approx2(1)+3(1)=5$, so the rule claims $pq\in[1,11]$. The true extremes are $p\in[1,3]$, $q\in[2,4]$, giving $pq\in[2,12]$ — the rule's own bound does not even reach the actual maximum.
