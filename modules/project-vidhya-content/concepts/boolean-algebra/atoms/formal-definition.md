---
id: boolean-algebra.formal-definition
concept_id: boolean-algebra
atom_type: formal_definition
bloom_level: 2
difficulty: 0.32
exam_ids: ["*"]
---

**Boolean Algebra**: An algebraic structure with:
- **Variables**: Take values in $\{0, 1\}$ (FALSE/TRUE).
- **Operations**:
  - **AND** ($\land$ or $\cdot$): $x \land y = 1$ iff $x=1$ AND $y=1$
  - **OR** ($\lor$ or $+$): $x \lor y = 1$ iff $x=1$ OR $y=1$
  - **NOT** ($\neg$ or $\bar{x}$): $\neg x = 1$ iff $x=0$

**Key Laws** (all Boolean algebras satisfy these):
- **Idempotence**: $x \lor x = x$, $x \land x = x$
- **Commutativity**: $x \lor y = y \lor x$, $x \land y = y \land x$
- **Associativity**: $(x \lor y) \lor z = x \lor (y \lor z)$, similarly for AND
- **Absorption**: $x \lor (x \land y) = x$, $x \land (x \lor y) = x$
- **De Morgan's Laws**: $\neg(x \land y) = \neg x \lor \neg y$, $\neg(x \lor y) = \neg x \land \neg y$
- **Distributivity**: $x \land (y \lor z) = (x \land y) \lor (x \land z)$, $x \lor (y \land z) = (x \lor y) \land (x \lor z)$
- **Complement**: $x \lor \neg x = 1$ (tautology), $x \land \neg x = 0$ (contradiction)
