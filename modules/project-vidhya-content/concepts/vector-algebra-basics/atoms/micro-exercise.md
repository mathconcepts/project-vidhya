---
id: vector-algebra-basics.micro-exercise
concept_id: vector-algebra-basics
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.20
exam_ids: ["*"]
estimated_minutes: 2
---

Two vectors lie flat in the $xy$-plane: $\vec{a} = 2\hat{i}$ and $\vec{b} = \hat{i} + 3\hat{j}$. What is $|\vec{a} \times \vec{b}|$?

- **(A)** 0
- **(B)** 2
- **(C)** 6
- **(D)** 6.32

<details>
<summary>Answer</summary>

**C**. Compute the cross product with $\vec{a} = (2, 0, 0)$ and $\vec{b} = (1, 3, 0)$:

$$\vec{a}\times\vec{b} = \hat{i}(0\cdot0 - 0\cdot3) - \hat{j}(2\cdot0 - 0\cdot1) + \hat{k}(2\cdot3 - 0\cdot1) = (0, 0, 6)$$

So $|\vec{a}\times\vec{b}| = 6$.

A) is wrong: a common misconception is that two vectors lying *in the same plane* automatically have zero cross product. That's only true if they're **parallel** — being coplanar with the $xy$-plane doesn't make $\vec{a}$ and $\vec{b}$ parallel to *each other*. Their cross product correctly points in the $\hat{k}$ direction, perpendicular to the plane both vectors live in.

B) confuses the answer with a single component product ($2\times1$) rather than the full cross-product formula.

D) computes $|\vec{a}||\vec{b}| = 2\times\sqrt{10} \approx 6.32$, which forgets to multiply by $\sin\theta$ — that only equals $|\vec{a}\times\vec{b}|$ when the vectors are perpendicular, and here they aren't.

The correct answer is C.

</details>
