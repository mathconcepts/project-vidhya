---
id: gram-schmidt.common-traps
concept_id: gram-schmidt
atom_type: common_traps
bloom_level: 3
difficulty: 0.5
exam_ids: ["*"]
tested_by_atom: gram-schmidt.micro-exercise
---

**Trap 1 — Projecting onto $v_j$ instead of $u_j$.** Gram-Schmidt builds a set of vectors that are orthogonal — meaning each one sits at a perfect right angle to every other, with zero overlap between them. Every projection step after the first must use the already-orthogonalized $u_j$ (or its normalized version $e_j$), never the original $v_j$ you started with. Using $v_j$ by mistake quietly brings back a component that an earlier step had already removed, and the result stops being orthogonal.

**Trap 2 — Forgetting a term in the sum.** Building $u_3$ means subtracting its projection onto *both* $u_1$ and $u_2$, not just the most recent one. Dropping the earlier term is the single most common arithmetic slip on any question with three or more vectors, because it's easy to focus only on the step you just did.

**Trap 3 — Confusing orthogonal with orthonormal.** The $u_i$'s that come straight out of the recursion are only orthogonal — at right angles to each other, but not necessarily length 1. To become orthonormal (at right angles *and* each of length exactly 1), you still need to divide each $u_i$ by its own norm (its length) to get $e_i$. A question that asks for an orthonormal basis and stops at the $u_i$'s hasn't finished the job.

**Trap 4 — Running Gram-Schmidt on a dependent set.** If the input vectors are not linearly independent — meaning one of them can be written as a combination of the others — some $u_i$ in the process comes out as the zero vector. You can't normalize $\mathbf{0}$, since dividing by a length of zero doesn't work. Check independence first; Gram-Schmidt itself won't warn you before it happens.
