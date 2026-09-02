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
difficulty: 0.0
exam_ids: ["*"]
variant_of: change-of-basis.hook
for_stance: assured
---

$[x]_{B'} = P_{B\to B'}^{-1}[x]_B$ — the coordinate vector transforms, the point itself doesn't. $P$'s columns are $B$'s vectors written in $B'$; get that direction backwards and every downstream computation inverts silently.

The generalization worth having ready: for a linear operator $T$, its matrix representation changes too, by similarity — $[T]_{B'} = P^{-1}[T]_B P$. A transformation that looks messy in the standard basis can become diagonal in the right one; that's the entire motivation for diagonalization, framed as a change of basis rather than a separate topic.
