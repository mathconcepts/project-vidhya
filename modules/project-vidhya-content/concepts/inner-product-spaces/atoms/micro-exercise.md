---
id: inner-product-spaces.micro_exercise
concept_id: inner-product-spaces
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.45
estimated_minutes: 2
exam_ids: ["*"]
---

**Question:** On $\mathbb{C}^2$, define $\langle u, v \rangle = u_1 \overline{v_1} + 2 u_2 \overline{v_2}$ where $u = (u_1, u_2)$ and $v = (v_1, v_2)$.

Is this a valid inner product? Justify.

<details>
<summary>Answer</summary>

**Yes**, this is a valid inner product. We verify the three axioms:

1. **Conjugate symmetry:** $\langle u, v \rangle = u_1 \overline{v_1} + 2 u_2 \overline{v_2}$ and $\overline{\langle v, u \rangle} = \overline{v_1 \overline{u_1} + 2 v_2 \overline{u_2}} = \overline{v_1} u_1 + 2 \overline{v_2} u_2 = \langle u, v \rangle$. ✓

2. **Linearity in the first argument:** $\langle \alpha u + \beta w, v \rangle = (\alpha u_1 + \beta w_1)\overline{v_1} + 2(\alpha u_2 + \beta w_2)\overline{v_2} = \alpha(u_1 \overline{v_1} + 2 u_2 \overline{v_2}) + \beta(w_1 \overline{v_1} + 2 w_2 \overline{v_2}) = \alpha \langle u, v \rangle + \beta \langle w, v \rangle$. ✓

3. **Positive definiteness:** $\langle u, u \rangle = u_1 \overline{u_1} + 2 u_2 \overline{u_2} = |u_1|^2 + 2|u_2|^2 \geq 0$, with equality iff $u_1 = u_2 = 0$ (i.e., $u = 0$). ✓

All axioms hold, so it is a valid inner product.

</details>