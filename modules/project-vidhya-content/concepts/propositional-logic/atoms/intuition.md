---
id: propositional-logic.intuition
concept_id: propositional-logic
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
---

## Propositional Logic: The Foundation of Reasoning

Propositional logic is the formal language of true-or-false statements and how they combine. Every proposition $p$ is either true (T) or false (F)—there's no middle ground.

**Why it matters for GATE:** Digital circuits, algorithms, and proofs all rely on propositional logic. Understanding connectives and equivalences is essential for simplifying boolean expressions in computer architecture and discrete maths questions.

**The four core connectives** let you build complex statements:

- **Negation** $\neg p$: flips the truth value (NOT)
- **Conjunction** $p \land q$: both must be true (AND)
- **Disjunction** $p \lor q$: at least one must be true (OR)
- **Implication** $p \to q$: "if p then q" (equivalent to $\neg p \lor q$)

**Truth values propagate predictably.** A truth table exhaustively shows all combinations. For two propositions, there are 4 rows; for three, 8 rows. By systematically evaluating each row, you can check if a formula is a **tautology** (always true) or **contradiction** (always false).

**Equivalence is the key move:** two formulas are equivalent if they produce identical truth tables. For example, $p \to q \equiv \neg p \lor q$ always holds—swapping one form for the other doesn't change the meaning. Recognizing these patterns dramatically speeds up simplification in exams.

**Core insight:** Master the connectives and De Morgan's laws ($\neg(p \land q) \equiv \neg p \lor \neg q$), and you can decode almost any logic problem.
```

## File 2: visual-analogy.md
**Path:**
