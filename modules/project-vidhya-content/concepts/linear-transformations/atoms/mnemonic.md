---
id: linear-transformations.mnemonic
concept_id: linear-transformations
atom_type: mnemonic
bloom_level: 2
difficulty: 0.20
exam_ids: ["*"]
modality: mnemonic
---

**Linear means the grid stays a grid.** Lines stay lines, evenly spaced stays evenly spaced, and the origin stays put. Anything that bends, breaks, or shifts the origin is not linear.

**The disqualifier that costs one second: $T(\mathbf{0})$ must be $\mathbf{0}$.** It follows from $T(0\cdot\mathbf{v}) = 0\cdot T(\mathbf{v})$. Plug in the zero vector before anything else — a stray constant term kills linearity on the spot, and that's the most common way GATE builds a "not linear" option.

**What kills linearity, as "no constants, no curves, no bars":**

- a constant added on ($x + 1$) — shifts the origin
- a power or a product of coordinates ($x^2$, $xy$) — bends the grid
- an absolute value or a norm ($|x|$, $\|\mathbf{v}\|$) — breaks $T(-\mathbf{v}) = -T(\mathbf{v})$

**Building the matrix: feed it the basis, collect the columns.**

$$A = \big[\; T(e_1) \;\big|\; T(e_2) \;\big|\; \cdots \;\big|\; T(e_n) \;\big]$$

For $T(x,y,z) = (x+y,\; y+z)$: $T(e_1) = (1,0)$, $T(e_2) = (1,1)$, $T(e_3) = (0,1)$, so $A = \begin{pmatrix} 1 & 1 & 0 \\ 0 & 1 & 1\end{pmatrix}$. No solving, just three substitutions.

**Sanity-check reflex:** $A$ must be $\dim(W) \times \dim(V)$ — outputs tall, inputs wide. If your matrix is the wrong shape, you wrote $T(e_i)$ as rows instead of columns.
