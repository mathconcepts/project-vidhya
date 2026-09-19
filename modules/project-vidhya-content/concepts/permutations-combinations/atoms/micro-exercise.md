---
id: permutations-combinations.micro-exercise
concept_id: permutations-combinations
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.45
estimated_minutes: 2
exam_ids: ["*"]
---

In how many ways can a group of $3$ girls and $2$ boys be selected from a class of $6$ girls and $5$ boys?

A) $200$
B) $462$
C) $30$
D) $900$
E) $55$

<details>
<summary>Answer</summary>

**Correct answer: A) $200$.**

The girls and boys are chosen independently, so use the fundamental counting principle: (ways to choose $3$ girls from $6$) $\times$ (ways to choose $2$ boys from $5$).

$^6C_3 = \dfrac{6!}{3!\,3!} = 20$. $^5C_2 = \dfrac{5!}{2!\,3!} = 10$. Total: $20 \times 10 = 200$.

**Why the others fail:**
- B) $462 = {^{11}C_5}$ — this comes from pooling all $11$ students together and choosing $5$ of them without regard to gender, throwing away the requirement of exactly $3$ girls and $2$ boys.
- C) $30 = {^6C_3} + {^5C_2} = 20+10$ — this comes from adding the two independent counts instead of multiplying them, breaking the fundamental counting principle.
- D) $900$ over-counts by treating the selections as ordered (using $^nP_r$-style thinking) instead of unordered.
- E) $55 = {^{11}C_2}$, a mismatched combination that ignores the "$3$ girls" part of the requirement entirely.

</details>
