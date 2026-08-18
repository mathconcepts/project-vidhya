---
# Alternative body for trace.worked_example, served when the learner stance
# is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
#
# The fenced interactive block below is copied verbatim from the base
# atom so the widget cannot drift between variants; only prose differs.
id: trace.worked-example.shaken
concept_id: trace
atom_type: worked_example
bloom_level: 3
scaffold_fade: true
difficulty: 0.25
exam_ids: ["*"]
variant_of: trace.worked_example
for_stance: shaken
---

## The matrix

$A=\begin{pmatrix}2&1&0\\0&3&-1\\2&0&1\end{pmatrix}$. Find $\text{tr}(A)$ and check it against the eigenvalue sum.

## Add the diagonal

$2+3+1=6$, so $\text{tr}(A)=6$.

The characteristic polynomial's $\lambda^2$ coefficient is $\text{tr}(A)$ (by Vieta), so $\lambda_1+\lambda_2+\lambda_3=6$ too — without ever finding the eigenvalues themselves.

$$\boxed{\text{tr}(A)=6=\lambda_1+\lambda_2+\lambda_3}$$

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Compute and verify trace","steps":[{"prompt":"What are the three diagonal elements of $A$?","hint":"Read top-left, middle-middle, and bottom-right entries.","answer":"2, 3, and 1"},{"prompt":"Sum the diagonal elements to find $\\text{tr}(A)$.","hint":"Add: 2 + 3 + 1","answer":"$\\text{tr}(A) = 6$"},{"prompt":"By theory, what must $\\lambda_1 + \\lambda_2 + \\lambda_3$ equal?","hint":"Recall: trace equals sum of eigenvalues.","answer":"$\\lambda_1 + \\lambda_2 + \\lambda_3 = 6$"}],"caption":"The trace is both the sum of diagonal entries AND the sum of eigenvalues."}
```
