---
id: inner-product-spaces.common_traps
concept_id: inner-product-spaces
atom_type: common_traps
bloom_level: 4
difficulty: 0.55
exam_ids: ["*"]
---

**Trap 1: Forgetting the conjugate in complex inner products.**

Students often write $\langle u, v \rangle = u_1 v_1 + u_2 v_2 + \cdots$ in $\mathbb{C}^n$ (vectors with complex-number entries), with no conjugate bar anywhere. A "conjugate" just flips the sign of the imaginary part — $\overline{3+2i} = 3-2i$. Skip it and you break conjugate symmetry, the property that keeps $\langle v,v\rangle$ real (a length has to be a real number, never a complex one). The correct rule conjugates only the *second* vector's entries: $\langle u, v \rangle = u_1 \overline{v_1} + u_2 \overline{v_2} + \cdots$. Check it: $\langle v, u \rangle = v_1 \overline{u_1} + \cdots = \overline{u_1 \overline{v_1} + \cdots} = \overline{\langle u, v \rangle}$. ✓

**Trap 2: Assuming linearity in the second argument.**

Inner products are linear in the *first* slot — scalars pull straight out: $\langle \alpha u, v\rangle = \alpha\langle u,v\rangle$. In the *second* slot, though, complex inner product spaces are anti-linear (also called conjugate-linear) — the scalar pulls out but picks up a conjugate: $\langle u, \alpha v + \beta w \rangle = \overline{\alpha} \langle u, v \rangle + \overline{\beta} \langle u, w \rangle$. Students often drop that bar and write $\langle u, \alpha v \rangle = \alpha \langle u, v \rangle$. That's wrong in complex spaces — it only holds in real ones, where conjugation changes nothing.

**Trap 3: Confusing equality in Cauchy–Schwarz.**

Students memorize the Cauchy–Schwarz inequality $|\langle u, v \rangle| \leq \|u\| \|v\|$ but forget when it turns into an equality. Equality holds only when $u$ and $v$ are linearly dependent — meaning one is just a scaled copy of the other, like $v = 3u$. A common slip is writing "equality iff $\langle u, v \rangle = 0$" — but that describes orthogonality (the vectors being perpendicular, at 90°), a completely different condition from proportionality. GATE often gives a 2-mark question that quietly checks this distinction — get it backwards and you lose the marks.

**Trap 4: Treating norms as inner products.**

The norm $\|v\|$ (a fancy word for "length") is *derived* from the inner product — $\|v\| = \sqrt{\langle v, v \rangle}$ — not the other way round. So some students try to "verify" an inner product by checking only $\langle v, v \rangle \geq 0$. That's not enough. You need all three axioms: conjugate symmetry (Trap 1), linearity in the first slot (Trap 2), and positive definiteness — $\langle v,v\rangle \geq 0$ always, zero only when $v$ is the zero vector itself. Checking just one axiom is incomplete and will cost you marks.