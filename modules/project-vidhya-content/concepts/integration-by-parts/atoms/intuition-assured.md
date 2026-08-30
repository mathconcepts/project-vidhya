---
# Alternative body for integration-by-parts.intuition, served when the
# learner stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: integration-by-parts.intuition.assured
concept_id: integration-by-parts
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
variant_of: integration-by-parts.intuition
for_stance: assured
---

LIATE breaks down for the cyclic case: $\int e^x\sin x\,dx$ never simplifies by degree, since neither $e^x$ nor $\sin x$ becomes "more elementary" under differentiation — two applications return the *original* integral, not a simpler one. Let $I=\int e^x\sin x\,dx$; two passes give $I=e^x\sin x-e^x\cos x-I$, an algebraic equation *in* $I$, solved by isolating it: $2I=e^x(\sin x-\cos x)$, so $I=\dfrac{e^x(\sin x-\cos x)}{2}+C$.

The condition that makes this trick work, and the one that fails silently if ignored: both applications must choose $u$ consistently — always the trig factor, or always the exponential — never switching mid-derivation, or the second application undoes the first instead of closing the loop.

"Each step gets easier" is true for the polynomial-times-exponential family; it is false here, and recognizing which regime an integral belongs to is the actual skill LIATE alone does not teach.
