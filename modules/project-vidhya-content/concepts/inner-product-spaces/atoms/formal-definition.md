---
id: inner-product-spaces.formal_definition
concept_id: inner-product-spaces
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

**Definition:** An **inner product** on a complex vector space $V$ is a function $\langle \cdot, \cdot \rangle: V \times V \to \mathbb{C}$ satisfying:

1. **Conjugate symmetry:** $\langle u, v \rangle = \overline{\langle v, u \rangle}$ for all $u, v \in V$
2. **Linearity in the first argument:** $\langle \alpha u + \beta v, w \rangle = \alpha \langle u, w \rangle + \beta \langle v, w \rangle$ for all $u, v, w \in V$ and scalars $\alpha, \beta$
3. **Positive definiteness:** $\langle v, v \rangle > 0$ for all $v \in V \setminus \{0\}$, and $\langle 0, 0 \rangle = 0$

*Note:* For real vector spaces, conjugate symmetry reduces to ordinary symmetry $\langle u, v \rangle = \langle v, u \rangle$, and linearity in the first argument implies linearity in the second.

**Key Theorem (Cauchy–Schwarz Inequality):** For any inner product space $(V, \langle \cdot, \cdot \rangle)$ and vectors $u, v \in V$,
$$|\langle u, v \rangle| \leq \|u\| \|v\|$$
where $\|v\| := \sqrt{\langle v, v \rangle}$ is the **induced norm**. Equality holds if and only if $u$ and $v$ are linearly dependent.

**Angle Formula:** The angle $\theta$ between two nonzero vectors $u$ and $v$ is given by
$$\cos \theta = \frac{\langle u, v \rangle}{\|u\| \|v\|}$$

**Method Selector.** Use Cauchy–Schwarz when you need to bound $|\langle u,v\rangle|$ against the norms alone — it needs nothing about $u+v$. A tempting substitute, the triangle inequality $\|u+v\|\le\|u\|+\|v\|$, bounds a different quantity (the length of a sum) and cannot be rearranged into a bound on the inner product itself.