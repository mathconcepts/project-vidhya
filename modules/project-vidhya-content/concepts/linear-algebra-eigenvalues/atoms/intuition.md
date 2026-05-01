---
id: linear-algebra-eigenvalues.intuition
concept_id: linear-algebra-eigenvalues
atom_type: intuition
bloom_level: 2
difficulty: 0.15
exam_ids: ["*"]
modality: visual
---

Picture a matrix $A$ as a transformation. You feed it a vector $v$, it spits out $Av$. For most $v$, the output points in a different direction.

But for a few special $v$, $Av$ points the same direction as $v$ — only longer or shorter. Those are eigenvectors. The scaling factor is the eigenvalue $\lambda$:

$$Av = \lambda v$$

Eigenvectors are the axes the matrix doesn't rotate. They're the natural coordinate system *of that matrix*.
