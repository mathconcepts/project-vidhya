---
id: sets-relations.common-traps
concept_id: sets-relations
atom_type: common_traps
bloom_level: 3
difficulty: 0.5
exam_ids: ["*"]
---

**Trap 1 — Assuming symmetric relations are automatically equivalence relations.** Symmetry is one of three axioms; a relation can be reflexive and symmetric yet fail transitivity (e.g. "shares a common friend with").

**Trap 2 — Confusing antisymmetric with asymmetric.** Antisymmetric permits $aRb$ and $bRa$ only when $a=b$; it does **not** forbid $aRb$ and $bRa$ from coexisting for equal elements, unlike asymmetric, which forbids both directions outright.

**Trap 3 — Treating "reflexive + transitive" as sufficient.** That pair alone defines only a **preorder** — neither equivalence relation nor partial order is guaranteed without checking the third axiom.

**Trap 4 — Miscounting equivalence classes.** Classes must partition the set exactly — every element in exactly one class. A "class" that overlaps another or omits an element signals a broken symmetry or transitivity check upstream.
