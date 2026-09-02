---
id: change-of-basis.common-traps
concept_id: change-of-basis
atom_type: common_traps
bloom_level: 3
difficulty: 0.5
exam_ids: ["*"]
tested_by_atom: change-of-basis.micro-exercise
---

**Trap 1 — Building $P$ with rows instead of columns.** The change-of-basis matrix $P$ is built by taking each vector of the new basis (written in old coordinates) and standing it up as a **column**, not a row. Writing them as rows feels natural if you're used to just listing vectors out — but it silently transposes the whole matrix, and every computation after that point is wrong.

**Trap 2 — Applying $P$ in the wrong direction.** $P[x]_{B'}=[x]_B$ — so $P$ turns $B'$-coordinates into $B$-coordinates, not the other way round. If a question gives you coordinates in $B$ and asks for coordinates in $B'$, you need $P^{-1}$ (the matrix that undoes $P$), not $P$ itself. Reaching for $P$ when the question actually wants its inverse is the single most common slip on this topic.

**Trap 3 — Forgetting $P$ must be invertible.** "Invertible" means there's a matrix that can undo $P$, converting things back to where you started. $P$ is invertible exactly when its columns form a genuine basis: they're linearly independent (no vector in the set can be built from the others) and there are the right number of them. If the "new basis" a question hands you is actually dependent, no valid change-of-basis matrix exists at all — check independence before you try to invert anything.

**Trap 4 — Assuming the standard basis needs no matrix.** The standard basis is just the plain axis vectors — $(1,0,0)$, $(0,1,0)$, and so on. Converting *to* standard coordinates from $B$ is $P_{B\to E}$ (build it directly, columns = $B$'s vectors); converting *from* standard back to $B$ is that same $P$, inverted. Students often redo the whole calculation from scratch instead of simply inverting the matrix they already built.
