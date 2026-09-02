---
# Alternative body for jordan-normal-form.hook, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, the arithmetic
# done in full, and an explicit check. No praise, no reassurance, no
# mention of how the reader might be feeling.
id: jordan-normal-form.hook.shaken
concept_id: jordan-normal-form
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: jordan-normal-form.hook
for_stance: shaken
---

Take $A = \begin{pmatrix}5&1&0\\0&5&1\\0&0&5\end{pmatrix}$.

Its only eigenvalue is $5$, repeated three times: $\det(A-5I)=0$ gives $(5-\lambda)^3=0$.

Solve $(A-5I)v=0$: only one direction works, $v=(1,0,0)$. One eigenvector, not three.

$A$ cannot be diagonalized. It can still be written in **Jordan form** — the closest "almost-diagonal" shape available once eigenvectors run out.
