---
id: propositional-logic.formal-definition
concept_id: propositional-logic
atom_type: formal_definition
bloom_level: 2
difficulty: 0.35
exam_ids: ["*"]
---

A **tautology** is a compound proposition true under every assignment of truth values to its variables; a **contradiction** is false under all of them. Two propositions $A$ and $B$ are **logically equivalent** ($A \equiv B$) when they share the same truth table — every one of the $2^n$ rows agrees.

$$\neg(P \land Q) \equiv \neg P \lor \neg Q, \qquad \neg(P \lor Q) \equiv \neg P \land \neg Q$$

These are **De Morgan's laws**: negating a conjunction or disjunction flips the connective and negates each part.

**Method selector.** Use a full truth table to settle equivalence or tautology-hood whenever the formula has $3$ or fewer variables — $2^n$ rows is cheap to write out completely. Reaching instead for algebraic law-chaining (De Morgan, distributivity, absorption) on a $2$-variable formula wastes steps a $4$-row table settles directly; the laws earn their keep only once $n\ge4$ makes the full table too long to trust by eye.
