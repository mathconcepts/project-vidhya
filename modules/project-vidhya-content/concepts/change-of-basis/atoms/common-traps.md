---
id: change-of-basis.common-traps
concept_id: change-of-basis
atom_type: common_traps
bloom_level: 3
difficulty: 0.5
exam_ids: ["*"]
tested_by_atom: change-of-basis.micro-exercise
---

**Trap 1 — Building $P$ with rows instead of columns.** $P$'s **columns** are the new basis vectors in old coordinates. Writing them as rows silently transposes the matrix and every downstream computation is wrong from that point on.

**Trap 2 — Applying $P$ in the wrong direction.** $P[x]_{B'}=[x]_B$ (columns of $P$ are $B'$'s vectors *in* $B$), so converting $B$-coordinates to $B'$-coordinates needs $P^{-1}$, not $P$. Reaching for $P$ when the question wants the inverse is the single most common slip on this topic.

**Trap 3 — Forgetting $P$ must be invertible.** $P$ is invertible exactly when its columns form a genuine basis (linearly independent, correct count). If the "new basis" given in a question is actually dependent, no valid change-of-basis matrix exists — check independence before inverting anything.

**Trap 4 — Assuming the standard basis needs no matrix.** Converting *to* standard coordinates from $B$ is $P_{B\to E}$ (build directly, columns = $B$'s vectors); converting *from* standard back to $B$ is that same $P$, inverted. Students sometimes reach for a fresh calculation instead of just inverting the matrix they already built.
