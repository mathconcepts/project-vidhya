---
# Alternative body for least-squares.worked_example, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
id: least-squares.worked-example.shaken
concept_id: least-squares
atom_type: worked_example
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
variant_of: least-squares.worked_example
for_stance: shaken
---

**Problem.** Least squares solution of $\begin{pmatrix} 1 & 0 \\ 1 & 1 \\ 1 & 2 \end{pmatrix} \begin{pmatrix} x \\ y \end{pmatrix} = \begin{pmatrix} 1 \\ 2 \\ 2 \end{pmatrix}$.

**Build the normal equations.** $A^TA = \begin{pmatrix} 3 & 3 \\ 3 & 5 \end{pmatrix}$, $A^Tb = \begin{pmatrix} 5 \\ 6 \end{pmatrix}$.

**Solve $3x+3y=5$, $3x+5y=6$.** Subtract: $2y=1 \Rightarrow y=1/2$. Then $x = 5/3 - 1/2 = 7/6$.

**Check:** $r=b-A\hat x = (-1/6, 2/6, -1/6)$; $A^Tr = (0,0)$ ✓.

$$\boxed{\hat{x} = \begin{pmatrix} 7/6 \\ 1/2 \end{pmatrix}}$$

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Least Squares via Normal Equations","steps":[{"prompt":"Look at row 1 of $A^T$: (1,1,1). Look at column 2 of $A$: (0,1,2). Multiply matching entries and add. What is the (1,2) entry of $A^TA$?","hint":"$1\\cdot0 + 1\\cdot1 + 1\\cdot2$.","answer":"3 (sum: 1·0 + 1·1 + 1·2 = 3)"},{"prompt":"Now row 2 of $A^T$: (0,1,2). Dot it with $b = (1,2,2)$. What is the second entry of $A^Tb$?","hint":"$0\\cdot1 + 1\\cdot2 + 2\\cdot2$.","answer":"6 (0·1 + 1·2 + 2·2 = 6)"},{"prompt":"You have $3x+3y=5$ and $3x+5y=6$. Subtract the first from the second to cancel $x$. What is $y$?","hint":"$(3x+5y)-(3x+3y) = 6-5$, so $2y=1$.","answer":"1/2"}],"caption":"The normal equations $(A^T A)\\hat{x} = A^T b$ encode the orthogonal projection geometry."}
```
