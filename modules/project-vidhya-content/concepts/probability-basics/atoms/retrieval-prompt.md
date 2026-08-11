---
id: probability-basics.retrieval-prompt
concept_id: probability-basics
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
estimated_minutes: 3
---

Two fair dice are rolled simultaneously. What is the probability that the sum of the numbers shown is 7?

- **(A)** 1/6
- **(B)** 1/36
- **(C)** 5/36
- **(D)** 7/36

<details>
<summary>Answer</summary>

**A**. When two dice are rolled, the sample space consists of all ordered pairs $(i, j)$ where $i, j \in \{1, 2, 3, 4, 5, 6\}$.

Total outcomes: $|S| = 6 \times 6 = 36$

Favorable outcomes (sum = 7): We need pairs that add to 7.
$$A = \{(1,6), (2,5), (3,4), (4,3), (5,2), (6,1)\}$$

So $|A| = 6$ favorable outcomes.

$$P(\text{Sum} = 7) = \frac{6}{36} = \frac{1}{6} \approx 0.167$$

Geometrically, out of a $6 \times 6$ grid of 36 equally-likely outcomes, exactly 6 lie on the "sum = 7" diagonal.

</details>
