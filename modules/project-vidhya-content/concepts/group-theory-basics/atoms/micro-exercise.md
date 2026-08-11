---
id: group-theory-basics.micro-exercise
concept_id: group-theory-basics
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
estimated_minutes: 2
---

What is the order of the element $2$ in the group $(\mathbb{Z}_6, +)$?

- **(A)** 2
- **(B)** 3
- **(C)** 6
- **(D)** 1

<details>
<summary>Answer</summary>

**B**. The order of an element $a$ in a group is the smallest positive integer $n$ such that $na = e$ (the identity). In $(\mathbb{Z}_6, +)$, the identity is 0. Compute multiples of 2 mod 6: $1 \cdot 2 = 2$, $2 \cdot 2 = 4$, $3 \cdot 2 = 6 \equiv 0 \pmod{6}$. The order of 2 is 3. Alternatively, $\text{ord}(2) = \frac{6}{\gcd(2,6)} = \frac{6}{2} = 3$.

</details>
