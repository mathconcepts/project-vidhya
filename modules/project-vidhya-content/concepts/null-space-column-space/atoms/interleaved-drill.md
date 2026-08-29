---
id: null-space-column-space.interleaved-drill
concept_id: null-space-column-space
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.60
exam_ids: ["*"]
modality: drill
tested_by_atom: null-space-column-space.micro_exercise
---

**Cross-concept check: null space / column space → rank-nullity.**

$$A = \begin{pmatrix} 1 & 2 & 0 & -1 \\ 2 & 4 & 1 & 0 \\ 1 & 2 & 1 & 1 \end{pmatrix} \xrightarrow{\text{RREF}} \begin{pmatrix} 1 & 2 & 0 & -1 \\ 0 & 0 & 1 & 2 \\ 0 & 0 & 0 & 0 \end{pmatrix}$$

Pivots in columns 1 and 3; free variables $x_2, x_4$. So $\text{rank}(A) = 2$ and $\text{nullity}(A) = 2$ (verified).

**Question 1 (subspaces → rank-nullity):** $A$ is $3\times4$. Confirm rank-nullity — and say which of $3$ or $4$ the two dimensions have to add up to, and why.

*Answer:* $2 + 2 = 4 = n$, the number of **columns**. The theorem partitions the columns: each is either a pivot column (contributing 1 to the rank) or a free column (contributing 1 to the nullity). There are $n$ columns and no third category, so the two counts must total $n$. The row count $m = 3$ never enters — it only caps how large the rank can get, via $\text{rank} \le \min(m,n) = 3$.

**Question 2 (rank-nullity → subspaces):** Now consider $A^T$, which is $4\times3$. What are its rank and nullity? Where do $\text{Null}(A^T)$ and $\text{Col}(A^T)$ live?

*Answer:* Rank is transpose-invariant, so $\text{rank}(A^T) = 2$. But rank-nullity is applied to $A^T$'s own column count, which is $3$:

$$\text{nullity}(A^T) = 3 - 2 = 1$$

One dimension, not two — the same matrix, transposed, has a *different* nullity. (A basis is $(1,-1,1)^T$, verified.) As for homes: $\text{Null}(A^T) \subseteq \mathbb{R}^3$ and $\text{Col}(A^T) \subseteq \mathbb{R}^4$, exactly swapping the homes of $\text{Null}(A) \subseteq \mathbb{R}^4$ and $\text{Col}(A) \subseteq \mathbb{R}^3$.

Sanity check on all four numbers: $\text{rank} + \text{nullity}$ gives $2+2 = 4$ columns of $A$ ✓ and $2+1 = 3$ columns of $A^T$ ✓.

**Why this drill exists:** the single most expensive error in this topic is subtracting the rank from the wrong number — using $m$ (rows) instead of $n$ (columns). It survives undetected because the answer is a plausible small integer. Running the same matrix through the theorem twice, transposed, makes the asymmetry impossible to miss: the rank is identical both ways, and the nullity is not.
