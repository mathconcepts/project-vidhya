---
# Alternative body for differentiability.hook, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: differentiability.hook.assured
concept_id: differentiability
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: differentiability.hook
for_stance: assured
---

GATE's stock phrasing is "find $a,b$ so $f$ is differentiable at the junction" — a two-condition problem (match value, then match slope) that a student under pressure often collapses into one: matching the pieces' values (continuity) and stopping there, silently assuming differentiability follows for free. It never does — $|x|$ is the standard counterexample, continuous at $0$ with no single derivative there — and any piecewise problem needs the left- and right-hand derivatives checked separately, then set equal.
