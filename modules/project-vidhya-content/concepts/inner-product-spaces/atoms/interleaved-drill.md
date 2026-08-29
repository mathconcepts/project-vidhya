---
id: inner-product-spaces.interleaved-drill
concept_id: inner-product-spaces
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.60
exam_ids: ["*"]
modality: drill
tested_by_atom: inner-product-spaces.micro_exercise
---

**Cross-concept check: inner product spaces → Gram–Schmidt.**

Take $v_1 = (1, 1, 0)$ and $v_2 = (1, 0, 1)$ in $\mathbb{R}^3$, under two different inner products:

- **Standard:** $\langle u, v \rangle = u_1v_1 + u_2v_2 + u_3v_3$
- **Weighted:** $\langle u, v \rangle_M = u_1v_1 + 2u_2v_2 + u_3v_3$ (i.e. $M = \text{diag}(1,2,1)$, symmetric with positive minors, so it is a valid inner product)

**Question 1 (inner products):** Are $v_1$ and $v_2$ orthogonal under either one?

*Answer:* No, under neither. Standard: $\langle v_2, v_1 \rangle = 1\cdot1 + 0\cdot1 + 1\cdot0 = 1 \neq 0$. Weighted: $\langle v_2, v_1 \rangle_M = 1\cdot1 + 2(0)(1) + 1\cdot 0 = 1 \neq 0$. The *value* happens to agree here; the norms do not — $\|v_1\|^2 = 2$ but $\|v_1\|_M^2 = 1 + 2 = 3$.

**Question 2 (Gram–Schmidt):** Run one orthogonalization step, $\tilde{u}_2 = v_2 - \dfrac{\langle v_2, v_1 \rangle}{\langle v_1, v_1 \rangle} v_1$, under each inner product. Do you get the same vector?

*Answer:* No.

Standard: coefficient $= \tfrac{1}{2}$, so $\tilde{u}_2 = (1,0,1) - \tfrac12(1,1,0) = \left(\tfrac12, -\tfrac12, 1\right)$ — direction $(1,-1,2)$. Check: $\langle \tilde{u}_2, v_1 \rangle = \tfrac12 - \tfrac12 + 0 = 0$ ✓ (matches the normalized $\tfrac{1}{\sqrt{6}}(1,-1,2)$ that the standard process produces, verified).

Weighted: coefficient $= \tfrac{1}{3}$, so $\tilde{u}_2 = (1,0,1) - \tfrac13(1,1,0) = \left(\tfrac23, -\tfrac13, 1\right)$ — direction $(2,-1,3)$. Check: $\langle \tilde{u}_2, v_1 \rangle_M = \tfrac23 + 2\left(-\tfrac13\right) + 0 = 0$ ✓.

Two different "orthogonal" vectors from the same input, and $(1,-1,2)$ is not a multiple of $(2,-1,3)$.

**Why this drill exists:** students memorise Gram–Schmidt with the dot product silently baked in, so a weighted or function-space inner product breaks them. Orthogonality is not a property of two vectors — it is a property of two vectors *and the declared inner product*. The related slip is the denominator: it is $\langle v_1, v_1 \rangle = \|v_1\|^2$, not $\|v_1\|$, unless you already normalized.
