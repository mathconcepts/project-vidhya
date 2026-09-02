---
# Alternative body for propositional-logic.worked-example, stance `assured`.
id: propositional-logic.worked-example.assured
concept_id: propositional-logic
atom_type: worked_example
bloom_level: 3
difficulty: 0.2
exam_ids: ["*"]
scaffold_fade: true
variant_of: propositional-logic.worked-example
for_stance: assured
---

**Problem:** Determine whether $(P \to Q) \to (\neg Q \to \neg P)$ is a tautology.

Recognize the shape first: $\neg Q\to\neg P$ **is** the contrapositive of $P\to Q$, and $P\to Q \equiv \neg Q\to\neg P$ identically. Any implication of the form $X \to X'$, where $X'$ is logically equivalent to $X$, is a tautology without building a table — the antecedent and consequent always agree.

$$\boxed{\text{tautology, by } P\to Q \equiv \neg Q \to \neg P}$$

**Worth knowing:** this shortcut generalizes to any $A \leftrightarrow B$ tautology check — if $A$ and $B$ are already known-equivalent forms (De Morgan pairs, contrapositive pairs, double negation), cite the identity instead of building the full $2^n$ table. Building it anyway isn't wrong, just slower against a strict time budget.
