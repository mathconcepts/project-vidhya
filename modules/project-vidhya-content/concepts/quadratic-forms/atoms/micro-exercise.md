---
id: quadratic-forms.micro_exercise
concept_id: quadratic-forms
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.45
exam_ids: ["*"]
estimated_minutes: 2
---

Classify $f(x,y,z)=x^2+y^2-z^2+2xy$.

<details><summary>Answer</summary>

$A=\begin{pmatrix}1&1&0\\1&1&0\\0&0&-1\end{pmatrix}$ (cross-term $2xy$ halves to $a_{12}=a_{21}=1$). The upper-left block $\begin{pmatrix}1&1\\1&1\end{pmatrix}$ has eigenvalues $0,2$ (trace $2$, det $0$); the bottom-right block contributes $-1$. Eigenvalues $\{0,2,-1\}$ mix signs — **indefinite**.
</details>
