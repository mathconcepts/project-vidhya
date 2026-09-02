---
id: sets-relations.intuition
concept_id: sets-relations
atom_type: intuition
bloom_level: 2
difficulty: 0.1
exam_ids: ["*"]
modality: visual
---

Start from a guess: any relation built from "shares a property" behaves like equality — reflexive, symmetric, transitive, all for free. Test it on "is a friend of."

Reflexive? Debatable, skip it. Symmetric? Usually — if $a$ is a friend of $b$, $b$ is usually a friend of $a$. Transitive? Not remotely: $a$ friend of $b$, $b$ friend of $c$, does not make $a$ a friend of $c$. Two of a person's friends need not know each other at all.

One counterexample settles it: not every "natural" relation is transitive, and losing transitivity means the relation is no longer an equivalence relation — it can't be organized into clean, non-overlapping piles the way "same remainder mod $3$" can.

Contrast that with divisibility, $a \mid b$: reflexive ($a\mid a$) and transitive (if $a\mid b$ and $b\mid c$ then $a\mid c$) but not symmetric ($2\mid 4$ doesn't give $4\mid 2$). Divisibility is a **partial order**, not an equivalence relation — a different clean structure, built from a different pair of axioms.
