---
id: recurrence-relations.formal-definition
concept_id: recurrence-relations
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

**Recurrence Relation**: An equation that defines a sequence $\{a_n\}$ by expressing $a_n$ in terms of previous terms $a_{n-1}, a_{n-2}, \ldots, a_{n-k}$ plus possibly a function of $n$.

**Linear Homogeneous Recurrence Relation** (order $k$):
$$a_n = c_1 a_{n-1} + c_2 a_{n-2} + \cdots + c_k a_{n-k}$$
where $c_1, \ldots, c_k$ are constants.

**Solution Method**: Assume $a_n = r^n$ and substitute to get the **characteristic equation**:
$$r^n = c_1 r^{n-1} + c_2 r^{n-2} + \cdots + c_k r^{n-k}$$
Divide by $r^{n-k}$:
$$r^k = c_1 r^{k-1} + c_2 r^{k-2} + \cdots + c_k$$
Solve for roots $r_1, r_2, \ldots, r_k$. The general solution is $a_n = A_1 r_1^n + A_2 r_2^n + \cdots + A_k r_k^n$, with constants $A_i$ determined by initial conditions.
