---
# Alternative body for definite-integrals.hook, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: definite-integrals.hook.assured
concept_id: definite-integrals
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: definite-integrals.hook
for_stance: assured
---

GATE's "area under the curve" phrasing is a trap the moment the curve dips below the axis: $\int_a^b f\,dx$ gives the *signed* net, not the geometric area, so a region that straddles the axis needs splitting at each root, taking $|\cdot|$ on each piece, and summing — plugging straight into the fundamental theorem quietly cancels area against area instead of adding it.
