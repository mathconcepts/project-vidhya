---
id: rank-nullity.visual-analogy
concept_id: rank-nullity
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.30
exam_ids: ["*"]
modality: visual
---

Think of a matrix as a filter: rank is how many output "channels" make it through, and nullity is how many input directions get absorbed and never come out the other side. A $4\times4$ matrix with rank 3 lets through only 3 independent directions — one direction, however hard you push it in, comes out zero.

The curve below traces $y=\det(A_t)$ for $A_t=\begin{pmatrix}1&t\\1&1\end{pmatrix}$ as $t$ runs from $-2$ to $2$ (here $\det(A_t)=1-t$). It crosses zero at exactly $t=1$ — the instant both rows become the same row, rank drops from $2$ to $1$, and a fresh direction opens up in the null space. Away from that one point, rank stays $2$ and nullity stays $0$: the jump happens all at once, not by degrees.

```gif-scene
{"type":"function-trace","expression":"1-x","x_range":[-2,2],"y_range":[-2,3],"frames":30,"fps":12}
```
