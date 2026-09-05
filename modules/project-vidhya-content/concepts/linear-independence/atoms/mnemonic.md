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

```interactive-spec
{
  "v": 1,
  "kind": "manipulable",
  "title": "Drag two 2D vectors — watch the determinant test flip",
  "why": "For exactly two vectors in a 2D space, independence collapses to one number: the determinant of the matrix they form as columns. Drag them and watch it cross zero.",
  "inputs": [
    {"id": "a", "label": "v1 (x)", "min": -3, "max": 3, "step": 0.5, "initial": 1},
    {"id": "b", "label": "v1 (y)", "min": -3, "max": 3, "step": 0.5, "initial": 0},
    {"id": "c", "label": "v2 (x)", "min": -3, "max": 3, "step": 0.5, "initial": 2},
    {"id": "d", "label": "v2 (y)", "min": -3, "max": 3, "step": 0.5, "initial": 4}
  ],
  "outputs": [
    {"label": "det = a·d − b·c", "formula": "a*d - b*c", "digits": 2}
  ],
  "caption": "v1=(a,b), v2=(c,d) as columns. det=0 exactly when one vector is a scalar multiple of the other — dependent. Nonzero means independent, per the ladder's step 4."
}
```
