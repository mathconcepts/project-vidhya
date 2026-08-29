---
id: positive-definite-matrices.interleaved-drill
concept_id: positive-definite-matrices
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.60
exam_ids: ["*"]
modality: drill
tested_by_atom: positive-definite-matrices.micro-exercise
---

**Cross-concept check: positive definiteness → quadratic forms.**

Take the same matrix as the worked example, $A = \begin{pmatrix} 4 & 2 \\ 2 & 3 \end{pmatrix}$, with $D_1 = 4 > 0$ and $D_2 = \det(A) = 8 > 0$.

**Question 1 (quadratic forms):** Write out $f(x,y) = \mathbf{x}^T A \mathbf{x}$ explicitly.

*Answer:* $f(x,y) = 4x^2 + 2xy + 2yx + 3y^2 = 4x^2 + 4xy + 3y^2$. The off-diagonal $2$ is counted **twice** — once as $a_{12}$ and once as $a_{21}$ — which is exactly why the matrix entry is *half* the cross-term coefficient in the other direction.

**Question 2 (positive definiteness, from the definition):** Complete the square on $f$ and show $f(x,y) > 0$ for every $(x,y) \neq (0,0)$ — without computing a single eigenvalue.

*Answer:*
$$4x^2 + 4xy + 3y^2 = 4\left(x + \tfrac{y}{2}\right)^2 + 2y^2$$
(Check: $4\left(x + \tfrac{y}{2}\right)^2 = 4x^2 + 4xy + y^2$, and $y^2 + 2y^2 = 3y^2$ ✓.)

Both terms are squares with positive coefficients, so $f \geq 0$ always. It equals zero only when $y = 0$ **and** $x + \tfrac{y}{2} = 0$, i.e. only at the origin. So $A$ is positive definite, straight from the definition.

Now look at those coefficients: $4 = D_1$ and $2 = D_2 / D_1 = 8/4$. The completed-square coefficients *are* the successive ratios of leading principal minors — which is precisely why Sylvester's criterion works. Positive minors $\Leftrightarrow$ positive square coefficients $\Leftrightarrow$ a sum of squares.

**Why this drill exists:** students learn positive definiteness as a determinant recipe and forget it is a claim about a *function* being positive in every direction. Completing the square is the bridge — it turns Sylvester from a rule to memorise into a computation you could have derived, and it is the fastest way to answer "why is that the test?" if you have to reconstruct it under exam pressure.
