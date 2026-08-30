---
# Alternative body for interpolation.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: interpolation.hook.assured
concept_id: interpolation
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: interpolation.hook
for_stance: assured
---

A degree-$(n-1)$ polynomial through $n$ distinct nodes matches every one of them exactly — guaranteed by construction, nothing to check. What isn't guaranteed is accuracy *between* the nodes: Runge's function $f(x)=1/(1+25x^2)$ on equally spaced points over $[-1,1]$ still passes through every sample exactly, yet oscillates wildly near the endpoints, and adding more equally spaced points makes it worse, not better.
