---
id: lu-factorization.micro_exercise
concept_id: lu-factorization
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.45
exam_ids: ["*"]
estimated_minutes: 2
---

Find $u_{22}$ in the Doolittle factorization of $A=\begin{pmatrix}2&1\\6&8\end{pmatrix}$.

<details><summary>Answer</summary>

$u_{11}=2$, $u_{12}=1$. $\ell_{21}=6/2=3$. $u_{22}=8-\ell_{21}u_{12}=8-3(1)=5$.

Check: $\begin{pmatrix}1&0\\3&1\end{pmatrix}\begin{pmatrix}2&1\\0&5\end{pmatrix}=\begin{pmatrix}2&1\\6&8\end{pmatrix}=A$ ✓.
</details>
