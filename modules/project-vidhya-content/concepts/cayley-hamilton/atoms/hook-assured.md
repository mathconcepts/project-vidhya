---
# Alternative body for cayley-hamilton.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: cayley-hamilton.hook.assured
concept_id: cayley-hamilton
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: cayley-hamilton.hook
for_stance: assured
---

$p(A) = 0$ for the matrix's own characteristic polynomial — exact, not an approximation. That single fact reduces $A^n$ for any $n$ to a linear combination of $I, A, \dots, A^{n-1}$, and rearranges cleanly to give $A^{-1}$ without touching a cofactor.

Where does the reduction stop paying off as $n$ grows past 2 or 3?
