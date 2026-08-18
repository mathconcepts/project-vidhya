---
# Alternative body for least-squares.worked_example, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: least-squares.worked-example.assured
concept_id: least-squares
atom_type: worked_example
bloom_level: 3
difficulty: 0.25
scaffold_fade: true
exam_ids: ["*"]
variant_of: least-squares.worked_example
for_stance: assured
---

**Problem.** $\begin{pmatrix} 1 & 0 \\ 1 & 1 \\ 1 & 2 \end{pmatrix} \begin{pmatrix} x \\ y \end{pmatrix} = \begin{pmatrix} 1 \\ 2 \\ 2 \end{pmatrix}$, least squares.

$$A^TA = \begin{pmatrix}3&3\\3&5\end{pmatrix}, \quad A^Tb=\begin{pmatrix}5\\6\end{pmatrix} \;\Rightarrow\; \begin{cases}3x+3y=5\\3x+5y=6\end{cases} \;\Rightarrow\; y=\tfrac12,\ x=\tfrac76$$

$$\boxed{\hat{x} = \begin{pmatrix} 7/6 \\ 1/2 \end{pmatrix}}$$

**The check that matters more than re-solving:** $r=b-A\hat x = (-1/6, 2/6, -1/6)$ must satisfy $A^Tr=0$ — confirmed here. This is *the* fast way to catch an arithmetic error in $\hat x$ without redoing the elimination.

**Where this generalizes.** With $A$'s two columns already independent (rank 2), $A^TA$ is guaranteed invertible — no need to check separately. Fitting a line $y=mx+c$ to three data points is exactly this setup with $A$'s first column all-ones; recognize that shape on sight rather than re-deriving the normal equations each time.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Least Squares via Normal Equations","steps":[{"prompt":"Compute $A^T A$ for the given matrix $A$. What is the (1,2) entry?","hint":"Multiply the first row of $A^T$ by the second column of $A$.","answer":"3 (sum: 1·0 + 1·1 + 1·2 = 3)"},{"prompt":"Compute $A^T b$. What is the second entry?","hint":"Multiply the second row of $A^T$ by vector $b$: (0, 1, 2) · (1, 2, 2).","answer":"6 (0·1 + 1·2 + 2·2 = 6)"},{"prompt":"Solve $3x + 3y = 5$ and $3x + 5y = 6$. What is $y$?","hint":"Subtract equation 1 from equation 2 to eliminate $x$.","answer":"1/2"}],"caption":"The normal equations $(A^T A)\\hat{x} = A^T b$ encode the orthogonal projection geometry."}
```
