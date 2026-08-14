---
id: inner-product-spaces.retrieval_prompt
concept_id: inner-product-spaces
atom_type: retrieval_prompt
bloom_level: 1
difficulty: 0.3
estimated_minutes: 1
exam_ids: ["*"]
---

**Recall Question:** State the Cauchy–Schwarz inequality for inner product spaces and specify when equality holds.

<details>
<summary>Answer</summary>

**Cauchy–Schwarz Inequality:** For an inner product space $(V, \langle \cdot, \cdot \rangle)$ and any $u, v \in V$,
$$|\langle u, v \rangle| \leq \|u\| \|v\|$$
where $\|w\| = \sqrt{\langle w, w \rangle}$ is the norm induced by the inner product.

**Equality condition:** Equality holds if and only if $u$ and $v$ are linearly dependent, i.e., one is a scalar multiple of the other. Equivalently, equality holds iff $u = \alpha v$ for some $\alpha \in \mathbb{C}$ (or $\alpha = 0$).

*Note:* This is a 1-mark recall item in GATE-MA. A complete 2-mark answer should also prove the inequality (e.g., by considering $\|u - \lambda v\|^2 \geq 0$ for a chosen $\lambda$).

</details>