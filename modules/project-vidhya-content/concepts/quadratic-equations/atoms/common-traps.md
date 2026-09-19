---
id: quadratic-equations.common-traps
concept_id: quadratic-equations
atom_type: common_traps
bloom_level: 4
difficulty: 0.4
exam_ids: ["*"]
---

- **Sign error in the sum formula**: writing sum of roots $= b/a$ instead of $-b/a$. The minus sign is not optional — it comes directly from matching $a(x-\alpha)(x-\beta)$ to $ax^2+bx+c$, and dropping it flips the sign of every answer built on it.

- **Checking only one common-root case**: when two quadratics share a root, either of the fixed equation's two roots could be the shared one. Testing only the first candidate and stopping — without checking the second — silently discards a genuine second answer.

- **Treating $D\ge0$ as settling a location question**: real roots existing (from $D\ge0$) says nothing about *where* those roots sit. A full "roots lie in this interval" claim needs the discriminant, the sign of $a\cdot f(k)$ at the boundary, and the vertex position, checked together — not the discriminant alone.

- **Assuming complex roots only when coefficients "look messy"**: $D<0$ can happen even with small, clean integer coefficients (like $x^2+x+1=0$). The nature of the roots depends only on the *sign* of $D$, never on how the numbers look.

- **Confusing "roots are real" with "roots are positive"**: $D\ge0$ only guarantees real roots. Positive roots additionally need sum $=-b/a>0$ and product $=c/a>0$ — three separate conditions, not one.
