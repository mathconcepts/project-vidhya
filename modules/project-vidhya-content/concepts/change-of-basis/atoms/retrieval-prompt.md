---
id: change-of-basis.retrieval-prompt
concept_id: change-of-basis
atom_type: retrieval_prompt
bloom_level: 1
difficulty: 0.3
estimated_minutes: 1
exam_ids: ["*"]
---

# Retrieval Prompt: Coordinate Transformation Formula

## Question

Let $B = \{v_1, v_2, \ldots, v_n\}$ be a basis of $\mathbb{R}^n$, and let $E$ be the standard basis. If $P = [v_1 | v_2 | \cdots | v_n]$ (the matrix with basis vectors as columns), state the relationship between $[x]_E$ (coordinates in the standard basis) and $[x]_B$ (coordinates in basis $B$).

## Answer

<details>
<summary>Show Answer</summary>

$$[x]_E = P[x]_B$$

**Explanation:** The matrix $P$ is the change-of-basis matrix *from* $B$ *to* $E$ (standard basis). Multiplying $P$ on the left by the coordinate vector $[x]_B$ (in basis $B$) gives the coordinate vector $[x]_E$ (in the standard basis).

Equivalently, the inverse relationship is:
$$[x]_B = P^{-1}[x]_E.$$

**Mnemonic:** $P$ "moves you forward" from $B$ to $E$; $P^{-1}$ "moves you backward" from $E$ to $B$.

</details>