---
# Alternative body for positive-definite-matrices.worked-example, served when the learner stance is
# `assured`. The base file is what a steady student reads.
id: positive-definite-matrices.worked-example.assured
concept_id: positive-definite-matrices
atom_type: worked_example
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
variant_of: positive-definite-matrices.worked-example
for_stance: assured
---

$A = \begin{pmatrix} 4 & 2 \\ 2 & 3 \end{pmatrix}$: $D_1 = 4 > 0$, $D_2 = \det(A) = 8 > 0$ — Sylvester passes, positive definite, no eigenvalue computation required.

**Cross-check for free, since $A$ is $2\times2$:** $\operatorname{tr}(A) = 7$, $\det(A) = 8$ give $\lambda^2-7\lambda+8=0$ directly, $\lambda = \frac{7\pm\sqrt{17}}{2}$ — both positive since $\sqrt{17} < 7$. Same conclusion, second route, useful when a question asks for the eigenvalues anyway.

**Where minors mislead:** for $n \ge 3$, checking only $D_1$ and $D_n$ (skipping intermediate leading minors) is a common shortcut that fails — every leading principal minor from $1$ to $n$ must be positive, not just the extremes.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Testing Positive Definiteness via Sylvester's Criterion","steps":[{"prompt":"What is the first leading principal minor $D_1$?","hint":"It is just the element $A_{11}$.","answer":"$D_1 = 4$"},{"prompt":"Compute the full determinant $D_2 = \\det(A)$.","hint":"For a $2 \\times 2$ matrix, use $ad - bc$.","answer":"$D_2 = (4)(3) - (2)(2) = 8$"},{"prompt":"What is the conclusion from Sylvester's criterion?","hint":"Check: are both $D_1 > 0$ and $D_2 > 0$?","answer":"Yes, both strictly positive, so by Sylvester's criterion, $A$ is positive definite."}],"caption":"Sylvester's criterion: all leading principal minors must be strictly positive for positive definiteness."}
```
