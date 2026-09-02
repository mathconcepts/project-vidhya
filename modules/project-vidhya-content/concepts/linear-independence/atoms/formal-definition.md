---
id: linear-independence.formal-definition
concept_id: linear-independence
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

**Definition.** A finite set of vectors $\{v_1, v_2, \ldots, v_k\}$ in a vector space $V$ is **linearly independent** if the only solution to
$$c_1 v_1 + c_2 v_2 + \cdots + c_k v_k = \mathbf{0}$$
is $c_1 = c_2 = \cdots = c_k = 0$. If there exists a non-trivial solution (at least one $c_i \neq 0$), the set is **linearly dependent**.

**Key Theorem (Basis Characterization).** A set of vectors is linearly independent if and only if no vector in the set can be expressed as a linear combination of the others. Furthermore, a linearly independent set that spans the entire vector space forms a **basis** of that space. For $\mathbb{R}^n$, any basis consists of exactly $n$ vectors.

**Computational Test.** To check linear independence of $\{v_1, \ldots, v_k\} \in \mathbb{R}^n$: arrange them as columns of an $n \times k$ matrix $A$, and solve $A \mathbf{c} = \mathbf{0}$. The set is linearly independent iff $\mathbf{c} = \mathbf{0}$ is the only solution (rank$(A) = k$).

**Method Selector.** Use the determinant/rank test whenever the vectors are given as coordinate tuples — it settles independence for the *whole set at once*. A tempting shortcut, checking that no two vectors look like scalar multiples of each other, only rules out **pairwise** dependence and misses whole-set dependence: $(1,0)$, $(0,1)$, $(1,1)$ are pairwise independent yet dependent as a set.