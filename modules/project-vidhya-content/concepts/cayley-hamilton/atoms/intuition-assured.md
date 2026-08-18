---
# Alternative body for cayley-hamilton.intuition, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: cayley-hamilton.intuition.assured
concept_id: cayley-hamilton
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
variant_of: cayley-hamilton.intuition
for_stance: assured
---

## Why this is more than a curiosity

$p(A) = 0$ collapses $I, A, A^2, \ldots$ into an $n$-dimensional space — every higher power of $A$ is a linear combination of the first $n-1$. Matrix powers live in a finite-dimensional space no matter how far out you go; that's the real content, not the vanishing itself.

Two uses that actually show up on the exam: reducing $A^k$ for large $k$ without repeated multiplication, and rearranging $p(A)=0$ to get $A^{-1}$ directly — faster than adjugate over determinant once $n$ is small and the polynomial is already sitting there.

Where the shortcut runs out: for $3\times3$ and larger, finding the characteristic polynomial is the expensive part Cayley-Hamilton never touches.
