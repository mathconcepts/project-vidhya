---
id: numerical-linear-algebra.retrieval-prompt
concept_id: numerical-linear-algebra
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
estimated_minutes: 3
retention_tags: ["lu-decomposition", "multiplier"]
---

Before checking, try to recall: factor $A=\begin{pmatrix}2&4\\3&5\end{pmatrix}$ into $LU$ with $L$ unit lower-triangular.

- **(A)** $L=\begin{pmatrix}1&0\\1.5&1\end{pmatrix}$, $U=\begin{pmatrix}2&4\\0&-1\end{pmatrix}$
- **(B)** $L=\begin{pmatrix}1&0\\1.5&1\end{pmatrix}$, $U=\begin{pmatrix}2&4\\0&1\end{pmatrix}$
- **(C)** $L=\begin{pmatrix}1&0\\0.67&1\end{pmatrix}$, $U=\begin{pmatrix}2&4\\0&-1\end{pmatrix}$
- **(D)** $L=\begin{pmatrix}1&0\\1&1\end{pmatrix}$, $U=\begin{pmatrix}2&4\\0&1\end{pmatrix}$

<details>
<summary>Answer</summary>

**A**. $m_{21}=3/2=1.5$. New row 2 $=(3,5)-1.5(2,4)=(0,-1)$. So $U=\begin{pmatrix}2&4\\0&-1\end{pmatrix}$, $L=\begin{pmatrix}1&0\\1.5&1\end{pmatrix}$. Check: $LU=\begin{pmatrix}2&4\\3&5\end{pmatrix}=A$ ✓.

</details>
