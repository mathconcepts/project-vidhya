---
id: inner-product-spaces.common_traps
concept_id: inner-product-spaces
atom_type: common_traps
bloom_level: 4
difficulty: 0.55
exam_ids: ["*"]
---

**Trap 1: Forgetting the conjugate in complex inner products.**

Students often write $\langle u, v \rangle = u_1 v_1 + u_2 v_2 + \cdots$ in $\mathbb{C}^n$ without the conjugate bar. This breaks conjugate symmetry and creates an asymmetric operation. Remember: in $\mathbb{C}^n$, the standard inner product is $\langle u, v \rangle = u_1 \overline{v_1} + u_2 \overline{v_2} + \cdots$ (conjugate the *second* argument). Verify: $\langle v, u \rangle = v_1 \overline{u_1} + \cdots = \overline{u_1 \overline{v_1} + \cdots} = \overline{\langle u, v \rangle}$. ✓

**Trap 2: Assuming linearity in the second argument.**

Inner products are linear in the *first* argument by definition. In complex inner product spaces, they are *anti-linear* (conjugate-linear) in the second: $\langle u, \alpha v + \beta w \rangle = \overline{\alpha} \langle u, v \rangle + \overline{\beta} \langle u, w \rangle$. Many students accidentally write $\langle u, \alpha v \rangle = \alpha \langle u, v \rangle$ (without the conjugate on $\alpha$). This is wrong in complex spaces but does hold in real inner product spaces.

**Trap 3: Confusing equality in Cauchy–Schwarz.**

Students memorize $|\langle u, v \rangle| \leq \|u\| \|v\|$ but forget the *equality condition*: equality holds if and only if $u$ and $v$ are linearly dependent (one is a scalar multiple of the other). Writing "equality iff $\langle u, v \rangle = 0$" is wrong (that's orthogonality, not proportionality). A 2-mark GATE question often penalizes missing or misstating the equality case.

**Trap 4: Treating norms as inner products.**

The norm $\|v\|$ is *derived* from the inner product via $\|v\| = \sqrt{\langle v, v \rangle}$, not the other way around. Some students try to "verify" an inner product by only checking that $\langle v, v \rangle \geq 0$. You must verify *all three axioms*: conjugate symmetry, linearity in the first argument, and positive definiteness. Checking only $\langle v, v \rangle \geq 0$ is incomplete and will lose marks.