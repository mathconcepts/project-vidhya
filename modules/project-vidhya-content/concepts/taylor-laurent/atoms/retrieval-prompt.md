---
id: taylor-laurent.retrieval-prompt
concept_id: taylor-laurent
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
estimated_minutes: 3
---

Find the Laurent series expansion of $f(z) = \frac{1}{z(z-1)}$ around $z_0 = 0$ in the annulus $0 < |z| < 1$. What is the residue at $z = 0$?

- **(A)** Residue $= 1$
- **(B)** Residue $= -1$
- **(C)** Residue $= 0$
- **(D)** Residue $= 2$

<details>
<summary>Answer</summary>

**B**. Use partial fractions: $\frac{1}{z(z-1)} = \frac{A}{z} + \frac{B}{z-1}$.
Multiplying by $z(z-1)$: $1 = A(z-1) + Bz$.
Set $z = 0$: $1 = -A \Rightarrow A = -1$.
Set $z = 1$: $1 = B \Rightarrow B = 1$.
So $\frac{1}{z(z-1)} = -\frac{1}{z} + \frac{1}{z-1}$.
For $|z| < 1$:
$\frac{1}{z-1} = -\frac{1}{1-z} = -(1 + z + z^2 + z^3 + \cdots)$.
Therefore:
$f(z) = -\frac{1}{z} - (1 + z + z^2 + \cdots)$.
The Laurent series is $f(z) = -\frac{1}{z} - 1 - z - z^2 - \cdots$.
The residue is the coefficient of $z^{-1}$, which is $c_{-1} = -1$.

</details>
