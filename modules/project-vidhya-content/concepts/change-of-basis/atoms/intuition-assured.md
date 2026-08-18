---
# Alternative body for change-of-basis.intuition, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: change-of-basis.intuition.assured
concept_id: change-of-basis
atom_type: intuition
bloom_level: 2
difficulty: 0.15
modality: visual
exam_ids: ["*"]
variant_of: change-of-basis.intuition
for_stance: assured
---

A vector is a geometric object; its coordinate tuple is a description relative to a chosen basis. Two observers using different bases assign different tuples to the same vector — $P$ is the map between descriptions, not between vectors.

Build $P$ column-by-column: each new-basis vector, written in old-basis coordinates, becomes a column. $P^{-1}$ runs the conversion the other way.

**The trap worth flagging:** building $P$ backwards. $[x]_{B'} = P^{-1}[x]_B$ needs $P$'s columns in the source basis's coordinates — check which direction the question wants before you multiply, since $P \neq P^{-1}$ in general.
