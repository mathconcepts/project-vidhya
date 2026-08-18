---
# Alternative body for inner-product-spaces.hook, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: inner-product-spaces.hook.assured
concept_id: inner-product-spaces
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: inner-product-spaces.hook
for_stance: assured
---

An inner product $\langle\cdot,\cdot\rangle$ is the dot product's abstraction to any vector space — bilinear (or sesquilinear over $\mathbb{C}$), symmetric, positive-definite. Everything downstream — norm, angle, orthogonality, projection — is defined *in terms of* it, so a space earns eigenvalue and optimization machinery the moment it has one.

The generalization is the exam value: swap $\mathbb{R}^n$'s dot product for $\langle f,g\rangle = \int f g\, dx$ and Fourier series, Legendre polynomials, and least squares all fall out of the same three axioms.
