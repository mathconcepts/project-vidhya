---
# Alternative body for trace.intuition, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: trace.intuition.assured
concept_id: trace
atom_type: intuition
bloom_level: 2
difficulty: 0.15
modality: visual
exam_ids: ["*"]
variant_of: trace.intuition
for_stance: assured
---

$\text{tr}(A)=\sum_i a_{ii}=\sum_i\lambda_i$: the two sums coincide because the characteristic polynomial's $\lambda^{n-1}$ coefficient is $-\text{tr}(A)$, by Vieta. That gives a free consistency check on any eigenvalue computation — sum what you found, compare it to the diagonal sum, and a mismatch means arithmetic went wrong somewhere upstream.

Trace is similarity-invariant: $\text{tr}(P^{-1}AP)=\text{tr}(A)$, since similar matrices share a characteristic polynomial and therefore share eigenvalues. It's also additive ($\text{tr}(A+B)=\text{tr}(A)+\text{tr}(B)$) and satisfies $\text{tr}(AB)=\text{tr}(BA)$ for any conformable $A,B$ — cyclic under the trace, even where $AB\neq BA$ as matrices.

Where this earns marks: verifying eigenvalues without expanding the full characteristic polynomial, and recognizing $\text{tr}(A)=0$ as a fast necessary — not sufficient — condition worth checking before a longer computation.
