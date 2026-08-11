---
id: propositional-logic.micro-exercise
concept_id: propositional-logic
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
estimated_minutes: 2
---

Let $p$, $q$, and $r$ be propositions. Which of the following is a tautology?

- **(A)** $(p \land q) \lor (\neg p \land q)$
- **(B)** $(p \rightarrow q) \land (q \rightarrow r) \rightarrow (p \rightarrow r)$
- **(C)** $(p \lor q) \land (\neg p \lor r) \rightarrow (q \lor r)$
- **(D)** $(p \land q) \lor (\neg p \land \neg q)$

<details>
<summary>Answer</summary>

**B**. A tautology is true for all truth value assignments. Let's check option B: $(p \rightarrow q) \land (q \rightarrow r) \rightarrow (p \rightarrow r)$. This is the transitivity rule of implication (hypothetical syllogism). To verify: assume the antecedent $(p \rightarrow q) \land (q \rightarrow r)$ is true. If $p$ is false, then $p \rightarrow r$ is true. If $p$ is true, then from $p \rightarrow q$ being true, $q$ must be true; then from $q \rightarrow r$ being true, $r$ must be true, so $p \rightarrow r$ is true. Thus the entire implication is always true. For option A: when all three are false, we get FALSE $\lor$ FALSE = FALSE. Option D: when $p=T, q=F$, we get FALSE $\lor$ FALSE = FALSE. Option C is also not a tautology (can be verified by counterexample).

</details>
