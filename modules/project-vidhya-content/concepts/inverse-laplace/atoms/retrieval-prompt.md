---
id: inverse-laplace.retrieval-prompt
concept_id: inverse-laplace
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
estimated_minutes: 3
---

Use partial fractions to find $\mathcal{L}^{-1}\left\{\frac{7}{(s+1)(s+2)}\right\}$.

- **(A)** $7e^{-t} - 7e^{-2t}$
- **(B)** $7e^{-t} + 7e^{-2t}$
- **(C)** $e^{-t} - e^{-2t}$
- **(D)** $14e^{-t} - 7e^{-2t}$

<details>
<summary>Answer</summary>

**A**. Decompose: $\frac{7}{(s+1)(s+2)} = \frac{A}{s+1} + \frac{B}{s+2}$. Multiplying by $(s+1)(s+2)$: $7 = A(s+2) + B(s+1)$. At $s=-1$: $7 = A(1) \Rightarrow A=7$. At $s=-2$: $7 = B(-1) \Rightarrow B=-7$. So $F(s) = \frac{7}{s+1} - \frac{7}{s+2}$. Taking inverse transforms: $f(t) = 7e^{-t} - 7e^{-2t}$. The two poles at $s=-1$ and $s=-2$ produce exponential terms with decay rates 1 and 2; their residues (7 and −7) scale the amplitudes.

</details>
