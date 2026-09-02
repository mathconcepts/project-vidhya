---
id: linear-transformations.formal-definition
concept_id: linear-transformations
atom_type: formal_definition
bloom_level: 2
difficulty: 0.48
exam_ids: ["*"]
---

**Linear Transformation**: A function $T: V \to W$ (between vector spaces $V$ and $W$) is linear if:
1. $T(\mathbf{u} + \mathbf{v}) = T(\mathbf{u}) + T(\mathbf{v})$ for all $\mathbf{u}, \mathbf{v} \in V$
2. $T(c\mathbf{v}) = cT(\mathbf{v})$ for all $c \in \mathbb{F}$ and $\mathbf{v} \in V$

**Matrix Representation**: Every linear transformation $T: \mathbb{R}^n \to \mathbb{R}^m$ can be represented by an $m \times n$ matrix $A$ such that $T(\mathbf{x}) = A\mathbf{x}$.

**Kernel (Null Space)**: $\ker(T) = \{\mathbf{v} \in V : T(\mathbf{v}) = \mathbf{0}\}$
**Image (Range)**: $\text{Im}(T) = \{T(\mathbf{v}) : \mathbf{v} \in V\}$

**Rank-Nullity for Transformations**: $\dim(\text{Im}(T)) + \dim(\ker(T)) = \dim(V)$

**Method selector.** Decide injectivity/surjectivity by actually computing $\ker(T)$ (solve $A\mathbf{x}=\mathbf{0}$) or $\text{rank}(A)$ — never by comparing $\dim(V)$ and $\dim(W)$ alone. Matching dimensions is the tempting shortcut, but it only rules out an isomorphism when the dimensions *disagree*; a square matrix with matching dimensions can still have a nontrivial kernel, so equal dimensions never by themselves certify injectivity or surjectivity.
