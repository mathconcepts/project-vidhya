---
# Alternative body for gram-schmidt.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: gram-schmidt.hook.assured
concept_id: gram-schmidt
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: gram-schmidt.hook
for_stance: assured
---

Gram-Schmidt is projection-and-subtract, iterated: each new vector loses its component along every already-orthogonalized vector before it, then gets normalized. What it buys you is an orthonormal basis for the same span, which is the setup every projection formula, QR decomposition, and least-squares computation assumes.

The order of the input vectors changes the output basis — it does not change the span. Two different orderings of the same set can hand you two visibly different orthonormal bases, both correct.
