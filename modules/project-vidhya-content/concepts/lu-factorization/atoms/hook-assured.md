---
# Alternative body for lu-factorization.hook, served when the learner stance
# is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinction that actually costs
# marks rather than re-teaching what they can already do.
id: lu-factorization.hook.assured
concept_id: lu-factorization
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: lu-factorization.hook
for_stance: assured
---

$LU$ is elimination with its bookkeeping kept: $L$ isn't extra work, it's the multipliers you already computed, stored instead of discarded. The distinction worth marks: existence *without pivoting* needs every leading principal minor nonzero — not merely $\det A \neq 0$. A matrix can be invertible and still admit no LU factorization: $\begin{pmatrix}0&1\\1&0\end{pmatrix}$ has $\det=-1$ but a zero first pivot. The moment a pivot threatens zero, you're solving $PA=LU$, not $A=LU$.
