---
id: least-squares.worked_example
concept_id: least-squares
atom_type: worked_example
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
---

**Problem.** Find the least squares solution to $\begin{pmatrix} 1 & 0 \\ 1 & 1 \\ 1 & 2 \end{pmatrix} \begin{pmatrix} x \\ y \end{pmatrix} = \begin{pmatrix} 1 \\ 2 \\ 2 \end{pmatrix}$.

---

**Step 1 — Form $A^TA$ and $A^Tb$.** $A^TA = \begin{pmatrix} 1 & 1 & 1 \\ 0 & 1 & 2 \end{pmatrix} \begin{pmatrix} 1 & 0 \\ 1 & 1 \\ 1 & 2 \end{pmatrix} = \begin{pmatrix} 3 & 3 \\ 3 & 5 \end{pmatrix}$, $\quad A^Tb = \begin{pmatrix} 5 \\ 6 \end{pmatrix}$.

---

**Step 2 — Solve $(A^TA)\hat x = A^Tb$.** $3x+3y=5$ and $3x+5y=6$. Subtracting: $2y=1 \Rightarrow y=1/2$. Then $x=5/3-1/2=7/6$.

---

**Step 3 — Verify orthogonality.** $r = b-A\hat x = \begin{pmatrix}-1/6\\2/6\\-1/6\end{pmatrix}$. $A^Tr = \begin{pmatrix}1&1&1\\0&1&2\end{pmatrix}\begin{pmatrix}-1/6\\2/6\\-1/6\end{pmatrix}=\begin{pmatrix}0\\0\end{pmatrix}$ ✓.

$$\boxed{\hat{x} = \begin{pmatrix} 7/6 \\ 1/2 \end{pmatrix}}$$

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Least Squares via Normal Equations","steps":[{"prompt":"Compute $A^T A$ for the given matrix $A$. What is the (1,2) entry?","hint":"Multiply the first row of $A^T$ by the second column of $A$.","answer":"3 (sum: 1·0 + 1·1 + 1·2 = 3)"},{"prompt":"Compute $A^T b$. What is the second entry?","hint":"Multiply the second row of $A^T$ by vector $b$: (0, 1, 2) · (1, 2, 2).","answer":"6 (0·1 + 1·2 + 2·2 = 6)"},{"prompt":"Solve $3x + 3y = 5$ and $3x + 5y = 6$. What is $y$?","hint":"Subtract equation 1 from equation 2 to eliminate $x$.","answer":"1/2"}],"caption":"The normal equations $(A^T A)\\hat{x} = A^T b$ encode the orthogonal projection geometry."}
```
