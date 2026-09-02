---
id: jordan-normal-form.hook
concept_id: jordan-normal-form
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
---

Every matrix has directions it can only stretch, never turn — its eigenvectors, one independent direction per repeated eigenvalue slot. But a matrix can repeat an eigenvalue three times over and still hand you only one genuine direction. The other two slots stay empty: no second or third independent eigenvector exists to fill them.

$A = \begin{pmatrix}5&1&0\\0&5&1\\0&0&5\end{pmatrix}$ has eigenvalue $5$ three times over, and exactly one eigenvector. Diagonalization is out — there simply aren't enough directions. What does linear algebra fall back on instead, and how far short of "diagonal" does it have to settle?
