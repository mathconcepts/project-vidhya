---
id: quadratic-forms.interleaved-drill
concept_id: quadratic-forms
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.60
modality: drill
exam_ids: ["*"]
tested_by_atom: quadratic-forms.micro_exercise
---

**Cross-concept check: quadratic forms → symmetric matrices.**

Take $f(x,y,z) = 2x^2 + 3y^2 + 4z^2 + 4xy + 4yz$.

**Question 1 (quadratic forms):** Build the symmetric matrix $A$ with $f = \mathbf{x}^T A \mathbf{x}$.

*Answer:* Diagonal takes the square coefficients whole: $2, 3, 4$. Cross-terms halve: $4xy \to a_{12} = a_{21} = 2$; $4yz \to a_{23} = a_{32} = 2$; no $xz$ term, so $a_{13}=a_{31}=0$.

$$A = \begin{pmatrix} 2 & 2 & 0 \\ 2 & 3 & 2 \\ 0 & 2 & 4 \end{pmatrix}$$

Its eigenvalues are $6, 3, 0$ (verified: $6+3+0=9=\text{tr}(A)$ ✓, $6\cdot3\cdot0=0=\det(A)$ ✓). A zero and no negatives ⇒ **positive semi-definite**, not positive definite.

**Question 2 (symmetric matrices):** Now check $B = \begin{pmatrix} 2 & 4 & 0 \\ 0 & 3 & 4 \\ 0 & 0 & 4 \end{pmatrix}$. It also satisfies $\mathbf{x}^TB\mathbf{x}=f$, and being triangular, its eigenvalues are $2,3,4$ — all strictly positive. Does that make $f$ positive definite?

*Answer:* No. At $(x,y,z)=(2,-2,1)$: $f = 2(4)+3(4)+4(1)+4(2)(-2)+4(-2)(1) = 8+12+4-16-8=0$ — a nonzero vector where the form vanishes (it's exactly $A$'s $\lambda=0$ eigenvector). $B$'s eigenvalues $2,3,4$ describe $B$, not $f$, because $B$ is not symmetric. Only the symmetric representative's spectrum classifies the form.

**Why this drill exists:** the misconception is "any matrix $A$ with $\mathbf{x}^TA\mathbf{x}=f$ tells me about $f$." It doesn't. The bridge to eigenvalue reasoning — real eigenvalues, orthogonal eigenvectors, sign-based classification — runs entirely through the *symmetric* representative.
