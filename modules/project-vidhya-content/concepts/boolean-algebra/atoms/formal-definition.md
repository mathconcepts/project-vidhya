---
id: boolean-algebra.formal-definition
concept_id: boolean-algebra
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

A **Boolean algebra** is a set with $+$ (OR), $\cdot$ (AND), and $'$ (complement) satisfying identity, complement, commutative, associative, and distributive laws. Derived identities include **De Morgan's laws** ($\overline{A\cdot B}=A'+B'$, $\overline{A+B}=A'\cdot B'$) and the **absorption law** ($A+AB=A$).

A Boolean function's **Karnaugh map** arranges its truth table so adjacent cells (including wraparound between opposite edges) differ in exactly one variable; grouping adjacent $1$s into power-of-$2$-sized blocks reads off a minimal sum-of-products form.

**Method selector.** Use a Karnaugh map when the function has $4$ or fewer variables — the visual grid makes adjacency (and its wraparound) easy to spot by eye. Reach instead for the tabular Quine–McCluskey method once a $5$th or $6$th variable is added: a K-map's 2D grid stops representing adjacency reliably at that size, and eyeballing groupings on it is the fast route to a missed, non-minimal cover.
