---
id: matrix-operations.micro-exercise
concept_id: matrix-operations
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
estimated_minutes: 2
---

If $A = \begin{pmatrix} 2 & 1 \\ 0 & 3 \end{pmatrix}$ and $B = \begin{pmatrix} 1 & 0 \\ 2 & 1 \end{pmatrix}$, find the (1,2) entry of $AB$.

- **(A)** 1
- **(B)** 2
- **(C)** 4
- **(D)** 0

<details>
<summary>Answer</summary>

**A**. To find the (1,2) entry of $AB$, multiply row 1 of $A$ by column 2 of $B$:
$(AB)_{12} = 2 \cdot 0 + 1 \cdot 1 = 0 + 1 = 1$.

Full product, as a sanity check: $AB = \begin{pmatrix} 2 & 1 \\ 0 & 3 \end{pmatrix} \begin{pmatrix} 1 & 0 \\ 2 & 1 \end{pmatrix} = \begin{pmatrix} 2(1)+1(2) & 2(0)+1(1) \\ 0(1)+3(2) & 0(0)+3(1) \end{pmatrix} = \begin{pmatrix} 4 & 1 \\ 6 & 3 \end{pmatrix}$. The (1,2) entry is $1$ — option **(A)**. (Note $(AB)_{11}=4$, option C — a plausible trap if you grab the wrong entry.)

</details>
