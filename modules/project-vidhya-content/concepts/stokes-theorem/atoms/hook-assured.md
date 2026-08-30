---
# Alternative body for stokes-theorem.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: stokes-theorem.hook.assured
concept_id: stokes-theorem
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: stokes-theorem.hook
for_stance: assured
---

Traverse $C$ clockwise (viewed from above) while keeping $\hat n$ upward, and $\oint_C\mathbf F\cdot d\mathbf r$ picks up the wrong sign relative to $\iint_S(\nabla\times\mathbf F)\cdot d\mathbf S$ — the two sides of Stokes only agree when the right-hand rule links them: curl the fingers along the direction of travel, and the thumb must match $\hat n$. Flip either one alone and the theorem does not fail, the answer's sign does — a mismatch a diagram catches immediately and a formula alone does not.
