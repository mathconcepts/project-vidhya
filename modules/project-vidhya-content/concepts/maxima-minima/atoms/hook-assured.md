---
# Alternative body for maxima-minima.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: maxima-minima.hook.assured
concept_id: maxima-minima
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: maxima-minima.hook
for_stance: assured
---

Finding the absolute max/min on $[a,b]$ is a closed-interval-method question on GATE, not a bare critical-point question. The failure mode under pressure: solving $f'(x)=0$, evaluating only those points, and reporting the largest as the answer, silently skipping the endpoints $a$ and $b$. An absolute extremum can sit at an endpoint with no critical point there at all — the closed interval method exists exactly because critical points are not the whole candidate list.
