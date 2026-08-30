---
# Alternative body for sequences.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: sequences.hook.assured
concept_id: sequences
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: sequences.hook
for_stance: assured
---

"Find $\lim_{n\to\infty}a_n$" for a sequence defined recursively, $a_{n+1}=f(a_n)$, is a GATE setup with a hidden precondition — and the wrong shortcut is setting $L=f(L)$ and solving without first establishing that the limit *exists*. A fixed point of $f$ is only the limit if the sequence is already known to converge, typically via monotone-plus-bounded; plugging into $L=f(L)$ for a sequence that diverges or oscillates returns a number satisfying the equation while meaning nothing.
