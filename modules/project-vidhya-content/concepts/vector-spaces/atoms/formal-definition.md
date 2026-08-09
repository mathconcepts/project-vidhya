---
id: vector-spaces.formal-definition
concept_id: vector-spaces
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

**Vector Space**: A set $V$ over a field $\mathbb{F}$ (usually $\mathbb{R}$ or $\mathbb{C}$) is a vector space if it satisfies:
1. **Closure under addition**: $u, v \in V \implies u + v \in V$
2. **Closure under scalar multiplication**: $c \in \mathbb{F}, v \in V \implies cv \in V$
3. **Associativity** and **commutativity** of addition
4. **Additive identity** ($\mathbf{0}$ exists in $V$)
5. **Additive inverses** exist for all $v \in V$
6. **Associativity** and **distributivity** of scalar multiplication
7. **Multiplicative identity** ($1v = v$)

**Subspace**: $W \subseteq V$ is a subspace if: $\mathbf{0} \in W$, and for all $u, v \in W$ and $c \in \mathbb{F}$: $u + v \in W$ and $cv \in W$.

**Basis**: A set $\{\mathbf{v}_1, \ldots, \mathbf{v}_n\} \subseteq V$ is a basis if every $v \in V$ is uniquely expressible as $v = c_1\mathbf{v}_1 + \cdots + c_n\mathbf{v}_n$.

**Dimension**: The dimension of $V$, denoted $\dim(V)$, is the number of vectors in any basis.
