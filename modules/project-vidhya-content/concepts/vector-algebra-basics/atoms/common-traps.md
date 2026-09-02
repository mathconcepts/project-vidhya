---
id: vector-algebra-basics.common-traps
concept_id: vector-algebra-basics
atom_type: common_traps
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
tested_by_atom: vector-algebra-basics.micro-exercise
---

**Trap 1 — Treating vector addition like scalar addition.** $|\vec a+\vec b|\neq|\vec a|+|\vec b|$ unless the two vectors point the same way. The parallelogram law, not simple addition, governs the resultant's length.

**Trap 2 — Cross product is not commutative.** $\vec a\times\vec b=-(\vec b\times\vec a)$. Swapping the order flips the sign of every component — costly on a signed-area or right-hand-rule question.

**Trap 3 — Dropping the minus sign in the determinant expansion.** The $\hat\jmath$ term carries a **minus**: $\vec a\times\vec b=(a_2b_3-a_3b_2,\ -(a_1b_3-a_3b_1),\ a_1b_2-a_2b_1)$. Missing that minus gives a wrong direction, not just a wrong sign.

**Trap 4 — Reading a zero scalar triple product as "perpendicular."** A zero triple product means **coplanar**, not perpendicular — perpendicularity is a dot-product statement about two vectors, coplanarity a triple-product statement about three.
