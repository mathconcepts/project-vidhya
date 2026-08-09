---
id: counting-principles.micro-exercise
concept_id: counting-principles
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
estimated_minutes: 2
---

How many 3-letter codes can be formed using the letters A, B, C, D, E if repetition is not allowed?

- **(A)** 60
- **(B)** 120
- **(C)** 10
- **(D)** 15

<details>
<summary>Answer</summary>

**A**. Since repetition is not allowed and order matters (ABC ≠ ACB), this is a permutation problem.

We need to select and arrange 3 letters from 5 available letters.

$P(5, 3) = \frac{5!}{(5-3)!} = \frac{5!}{2!} = \frac{120}{2} = 60$

Alternatively, using the multiplication principle:
- Position 1: 5 choices
- Position 2: 4 choices (one letter already used)
- Position 3: 3 choices (two letters already used)
- Total: $5 \times 4 \times 3 = 60$ codes

</details>
