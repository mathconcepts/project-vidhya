---
id: least-squares.exam-pattern
concept_id: least-squares
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **NAT: "find the best-fit line through these points."** Never build $A$ and multiply it out. For a straight-line fit $y = c_0 + c_1x$ through $n$ points, the normal equations are always

  $$\begin{pmatrix} n & \sum x_i \\ \sum x_i & \sum x_i^2 \end{pmatrix}\begin{pmatrix} c_0 \\ c_1 \end{pmatrix} = \begin{pmatrix} \sum y_i \\ \sum x_i y_i \end{pmatrix}$$

  Four sums, read straight off a table. For the points $(0,1), (1,2), (2,2)$: $n = 3$, $\sum x_i = 3$, $\sum x_i^2 = 5$, $\sum y_i = 5$, $\sum x_iy_i = 6$, giving $\begin{pmatrix} 3&3\\3&5\end{pmatrix}\hat{x} = \begin{pmatrix} 5\\6\end{pmatrix}$ and $\hat{x} = \left(\tfrac{7}{6}, \tfrac{1}{2}\right)$ — the line $y = \tfrac{1}{2}x + \tfrac{7}{6}$ (verified). That's the same matrix the long way produces, at a fraction of the cost.

- **The trap: "$A^TA$ is always invertible."** False, and a standing MCQ distractor. $A^TA$ is invertible **iff $A$ has full column rank**. If the columns are dependent, the normal equations still hold but have infinitely many solutions — the least-squares solution is not unique, and the "canonical" one is the minimum-norm solution via the pseudoinverse $A^+$.

- **Second trap: what the residual is orthogonal to.** $\hat{r} \perp \text{col}(A)$ — the column space. Options saying "$\hat{r}$ is orthogonal to $b$" or "to $\hat{x}$" are wrong; $\hat{r}$ is generally not orthogonal to $b$ at all.

- **Third trap: "$\hat{x}$ solves $A\hat{x} = b$."** Only if $b$ already lies in $\text{col}(A)$, in which case the residual is zero and it wasn't a least-squares problem. For a genuine overdetermined system, no $x$ solves it exactly — that's the premise.

- **Free-mark fact:** minimising $\|b - Ax\|$ and minimising $\|b - Ax\|^2$ give the *same* $\hat{x}$ (squaring is monotone on non-negatives). Phrasing switches between the two are cosmetic, not a different problem.

- **Time budget:** a two-parameter fit is a $2\times2$ solve — under 2 minutes including the $A^T\hat{r} = 0$ check. If you're inverting $A^TA$ symbolically rather than solving two linear equations, you've chosen the slow path.
