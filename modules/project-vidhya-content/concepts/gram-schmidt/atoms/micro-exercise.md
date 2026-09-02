---
id: gram-schmidt.micro-exercise
concept_id: gram-schmidt
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.45
estimated_minutes: 2
exam_ids: ["*"]
---

Orthogonalize $v_1=(1,0)$, $v_2=(2,1)$ in $\mathbb{R}^2$ (leave $u_2$ un-normalized).

<details>
<summary>Answer</summary>

$u_1=v_1=(1,0)$. Projection coefficient: $c=\dfrac{v_2\cdot u_1}{u_1\cdot u_1}=\dfrac{2}{1}=2$.

$u_2 = v_2 - 2u_1 = (2,1)-(2,0) = (0,1)$.

Check: $u_1\cdot u_2 = 1(0)+0(1)=0$ — orthogonal.

</details>
