---
id: conformal-mapping.retrieval-prompt
concept_id: conformal-mapping
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
estimated_minutes: 3
---

At $z = 2 + i$, what is the scaling factor (magnification ratio) under the conformal map $f(z) = z^3$?

- **(A)** $|2 + i|^2 = 5$
- **(B)** $3|2 + i|^2 = 15$
- **(C)** $|f'(2+i)| = 3|2+i|^2 = 15$
- **(D)** $|2 + i|^3$

<details>
<summary>Answer</summary>

**C**. The scaling factor (magnification) at a point $z$ under a conformal map $f$ is given by $|f'(z)|$.
For $f(z) = z^3$, the derivative is $f'(z) = 3z^2$.
At $z = 2 + i$:
$f'(2+i) = 3(2+i)^2 = 3(4 + 4i + i^2) = 3(4 + 4i - 1) = 3(3 + 4i) = 9 + 12i$.
The magnitude is $|f'(2+i)| = |9 + 12i| = \sqrt{9^2 + 12^2} = \sqrt{81 + 144} = \sqrt{225} = 15$.
Alternatively, note that $|f'(2+i)| = 3|2+i|^2 = 3 \cdot 5 = 15$.

</details>
