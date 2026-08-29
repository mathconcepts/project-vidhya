---
id: change-of-basis.mnemonic
concept_id: change-of-basis
atom_type: mnemonic
bloom_level: 2
difficulty: 0.20
exam_ids: ["*"]
modality: mnemonic
---

**"P's columns are the new basis vectors, written in the old coordinates."** That single sentence builds $P$ every time — no formula to recall, just fill the columns.

**The sandwich, read right to left: IN → ACT → OUT.**

$$[T]_B = P^{-1} \, [T]_E \, P$$

A matrix product acts on a column vector from the *right*, so read it in that order:

- $P$ — take $B$-coordinates **IN** to standard coordinates
- $[T]_E$ — let $T$ **ACT**, in the coordinates where you know its matrix
- $P^{-1}$ — bring the result back **OUT** to $B$-coordinates

**Direction check reflex.** Every student mixes up $P$ and $P^{-1}$ at least once. Test it in three seconds: the vector $v_1$ has $B$-coordinates $[v_1]_B = e_1$, so a correct $P$ must send $e_1$ to $v_1$'s standard coordinates — that is, $Pe_1$ is the first column of $P$, which is $v_1$. If your candidate matrix fails that, you have the pair swapped.

**Free simplification:** if the columns of $P$ are orthonormal, then $P^{-1} = P^T$ — transpose instead of invert.
