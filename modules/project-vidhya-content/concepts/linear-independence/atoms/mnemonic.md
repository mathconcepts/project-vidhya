---
id: linear-independence.mnemonic
concept_id: linear-independence
atom_type: mnemonic
bloom_level: 2
difficulty: 0.20
exam_ids: ["*"]
modality: mnemonic
---

**"Only zero reaches zero."** A set is independent when the *only* way to combine the vectors into $\mathbf{0}$ is the boring way — every coefficient zero. One non-trivial recipe for $\mathbf{0}$ and the set is dependent. That single sentence is the definition and the test.

**The cheapest-test-first ladder — run it in this order and stop at the first hit:**

1. **Zero** — does the set contain $\mathbf{0}$? Dependent. ($1 \cdot \mathbf{0} = \mathbf{0}$ is a non-trivial recipe.) No computation.
2. **Count** — more vectors than the dimension of the space they live in? Dependent, always. No computation.
3. **Two vectors?** Independent iff neither is a scalar multiple of the other. Glance, don't solve.
4. **Square case** — exactly $n$ vectors in an $n$-dimensional space? Independent iff $\det \neq 0$. One determinant.
5. **Otherwise** — stack as columns, row-reduce, independent iff $\text{rank} = k$ (the number of vectors).

Steps 1–3 cost nothing and settle most exam options. Only reach for step 5 when the shape is genuinely rectangular.

**Sanity-check reflex:** when you conclude "dependent," *produce the relation*. Writing $v_3 = v_1 + 2v_2$ explicitly proves it and catches arithmetic slips; "the determinant looked like zero" does not.
