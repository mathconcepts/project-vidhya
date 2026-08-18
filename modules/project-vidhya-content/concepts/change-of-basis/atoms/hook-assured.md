---
# Alternative body for change-of-basis.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: change-of-basis.hook.assured
concept_id: change-of-basis
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: change-of-basis.hook
for_stance: assured
---

Coordinates are basis-dependent; the vector isn't. $[x]_B$ and $[x]_{B'}$ describe the same geometric object under two different bases, related by $[x]_{B'} = P^{-1}[x]_B$ for the change-of-basis matrix $P$.

The one thing worth locking in early: $P$'s columns are the *old* basis vectors written in the *new* basis's coordinates. Build it that way and every conversion collapses to a single matrix multiply — getting the direction backwards is the exam's favorite trap.
