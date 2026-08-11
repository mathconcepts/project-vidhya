---
id: sets-relations.retrieval-prompt
concept_id: sets-relations
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
estimated_minutes: 3
---

Let $R_1$ and $R_2$ be two equivalence relations on a set $S$. Which of the following is always an equivalence relation?

- **(A)** $R_1 \cup R_2$
- **(B)** $R_1 \cap R_2$
- **(C)** $R_1 - R_2$ (difference)
- **(D)** $R_1 \circ R_1$ (composition)

<details>
<summary>Answer</summary>

**B**. For each option, check if the result is reflexive, symmetric, and transitive. Option B: $R_1 \cap R_2$ — the intersection of two equivalence relations. Reflexivity: Since $R_1$ is reflexive, $(a,a) \in R_1$ for all $a$. Since $R_2$ is reflexive, $(a,a) \in R_2$ for all $a$. Thus $(a,a) \in R_1 \cap R_2$ for all $a$. ✓ Symmetry: If $(a,b) \in R_1 \cap R_2$, then $(a,b) \in R_1$ and $(a,b) \in R_2$. By symmetry of $R_1$, $(b,a) \in R_1$. By symmetry of $R_2$, $(b,a) \in R_2$. Thus $(b,a) \in R_1 \cap R_2$. ✓ Transitivity: If $(a,b), (b,c) \in R_1 \cap R_2$, then both are in $R_1$ and both are in $R_2$. By transitivity of $R_1$, $(a,c) \in R_1$. By transitivity of $R_2$, $(a,c) \in R_2$. Thus $(a,c) \in R_1 \cap R_2$. ✓ Option A (union) fails transitivity in general. Option C (difference) fails reflexivity. Option D (composition) may fail in various ways.

</details>
