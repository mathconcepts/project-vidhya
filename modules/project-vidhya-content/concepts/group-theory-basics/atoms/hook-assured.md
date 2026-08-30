---
# Alternative body for group-theory-basics.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: group-theory-basics.hook.assured
concept_id: group-theory-basics
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: group-theory-basics.hook
for_stance: assured
---

Confidence usually fails on exactly one axiom when checking a group: the inverse, taken on faith rather than verified. Rotations of a square under composition satisfy closure, associativity, an identity, and an inverse for every element, all four at once — restrict to just the two 90° and 270° rotations and closure itself breaks, since composing them twice can land outside that smaller set. Verifying three axioms and assuming the fourth is how a plausible-looking claim turns out not to be a group at all.
