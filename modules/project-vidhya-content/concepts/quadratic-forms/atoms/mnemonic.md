---
id: quadratic-forms.mnemonic
concept_id: quadratic-forms
atom_type: mnemonic
bloom_level: 2
difficulty: 0.20
modality: mnemonic
exam_ids: ["*"]
---

**"The diagonal keeps it all; the cross-term splits in half."**

Going from $f$ to $A$:

- coefficient of $x_i^2$ → sits whole at $a_{ii}$
- coefficient of $x_ix_j$ → **halved**, then placed at *both* $a_{ij}$ and $a_{ji}$

Going the other way ($A$ to $f$), off-diagonals get **doubled**, because each one is met twice in the sum. Halve going in, double coming out — that single sentence is where almost every sign-and-factor slip lives.

**What "form" means:** *homogeneous* of degree exactly 2. No linear term, no constant. A stray $x$ or a $+7$ means it isn't a quadratic form.

**Two-variable shortcut worth memorising.** Write $f = ax^2 + 2hxy + by^2$ (the $2h$ pre-halves the cross-term for you). Then:

$$\text{positive definite} \iff a > 0 \ \text{ and } \ ab - h^2 > 0$$

That is Sylvester's criterion written out for $2\times2$, with nothing left to derive.

**Sanity-check reflex:** substitute $\mathbf{x}=\mathbf{e}_1$ — you must get $a_{11}$ back. Then substitute $(1,1,0,\dots)$ — you must get $a_{11}+a_{22}+2a_{12}$. Two seconds, and it catches a forgotten halving before it reaches the eigenvalues.

```interactive-spec
{"v":1,"kind":"manipulable","title":"Drag a, h, b in f = ax² + 2hxy + by² — watch ab − h² decide positive definite","why":"This is Sylvester's test written for a quadratic form instead of a matrix. Drag h up and watch ab − h² fall through zero — that is the exact instant the bowl becomes a saddle.","inputs":[{"id":"a","label":"a","min":-5,"max":5,"step":0.5,"initial":2},{"id":"h","label":"h (half the xy coefficient)","min":-5,"max":5,"step":0.5,"initial":1},{"id":"b","label":"b","min":-5,"max":5,"step":0.5,"initial":3}],"outputs":[{"label":"a","formula":"a","digits":1},{"label":"ab − h²","formula":"a*b - h^2","digits":2}],"caption":"Positive definite needs a > 0 AND ab − h² > 0. Start at a=2, h=1, b=3 (a=2, ab−h²=5 — genuinely positive definite), then push h up toward 3 and watch ab−h² turn negative even though a and b never changed sign."}
```
