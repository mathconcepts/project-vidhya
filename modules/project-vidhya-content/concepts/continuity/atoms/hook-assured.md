---
# Alternative body for continuity.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: continuity.hook.assured
concept_id: continuity
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: continuity.hook
for_stance: assured
---

GATE hides this behind "show a root exists in $(a,b)$" — an Intermediate Value Theorem question wearing a continuity costume, easy to miss until the endpoint signs matter. Under pressure, the trap is treating "given by a single algebraic expression" as proof of continuity, when the real test is whether the *limit* at the suspect point equals the function's value there. A formula can be perfectly well-defined everywhere except the one point the question is actually asking about.
