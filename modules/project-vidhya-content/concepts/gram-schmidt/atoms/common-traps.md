---
id: gram-schmidt.common-traps
concept_id: gram-schmidt
atom_type: common_traps
bloom_level: 3
difficulty: 0.5
exam_ids: ["*"]
tested_by_atom: gram-schmidt.micro-exercise
---

**Trap 1 — Projecting onto $v_j$ instead of $u_j$.** Every projection after the first must use the already-orthogonalized $u_j$ (or $e_j$), never the original $v_j$. Using $v_j$ silently reintroduces a component the earlier step already removed, and the result stops being orthogonal.

**Trap 2 — Forgetting a term in the sum.** $u_3$ subtracts its projection onto *both* $u_1$ and $u_2$, not just the most recent one. Dropping the earlier term is the single most common arithmetic slip on a 3-vector question.

**Trap 3 — Confusing orthogonal with orthonormal.** The $u_i$'s from the raw recursion are only orthogonal; they still need dividing by their own norms to become the orthonormal $e_i$'s. A "find an orthonormal basis" question that stops at the $u_i$'s is incomplete.

**Trap 4 — Running Gram-Schmidt on a dependent set.** If the input vectors are not linearly independent, some $u_i$ comes out as the zero vector — you can't normalize $\mathbf{0}$. Check independence first; the process itself won't warn you.
