---
# Alternative body for trace.worked_example, served when the learner stance
# is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
#
# The fenced interactive block below is copied verbatim from the base
# atom so the widget cannot drift between variants; only prose differs.
id: trace.worked-example.assured
concept_id: trace
atom_type: worked_example
bloom_level: 3
scaffold_fade: true
difficulty: 0.25
exam_ids: ["*"]
variant_of: trace.worked_example
for_stance: assured
---

## Compute, then verify against Vieta

$A=\begin{pmatrix}2&1&0\\0&3&-1\\2&0&1\end{pmatrix}$: $\text{tr}(A)=2+3+1=6$.

The characteristic polynomial $\det(A-\lambda I)=-\lambda^3+\text{tr}(A)\lambda^2+\ldots$ has $\lambda^2$-coefficient $\text{tr}(A)$, so by Vieta $\lambda_1+\lambda_2+\lambda_3=\text{tr}(A)=6$ — confirmed without ever solving the characteristic equation.

$$\boxed{\text{tr}(A)=6=\lambda_1+\lambda_2+\lambda_3}$$

## Why this is worth doing first

On any eigenvalue question, compute the trace before touching the characteristic polynomial. It's a free check afterward, and on GATE items that ask only for the sum or product of eigenvalues, it's the entire solution.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Compute and verify trace","steps":[{"prompt":"What are the three diagonal elements of $A$?","hint":"Read top-left, middle-middle, and bottom-right entries.","answer":"2, 3, and 1"},{"prompt":"Sum the diagonal elements to find $\\text{tr}(A)$.","hint":"Add: 2 + 3 + 1","answer":"$\\text{tr}(A) = 6$"},{"prompt":"By theory, what must $\\lambda_1 + \\lambda_2 + \\lambda_3$ equal?","hint":"Recall: trace equals sum of eigenvalues.","answer":"$\\lambda_1 + \\lambda_2 + \\lambda_3 = 6$"}],"caption":"The trace is both the sum of diagonal entries AND the sum of eigenvalues."}
```
