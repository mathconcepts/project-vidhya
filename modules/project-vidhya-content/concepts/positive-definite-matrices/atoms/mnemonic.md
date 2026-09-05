---
id: positive-definite-matrices.mnemonic
concept_id: positive-definite-matrices
atom_type: mnemonic
bloom_level: 2
difficulty: 0.20
modality: mnemonic
exam_ids: ["*"]
---

**"Definite" = the sign never wavers.** $\mathbf{x}^T A \mathbf{x} > 0$ in *every* direction, not most of them. Picture the surface $z = \mathbf{x}^T A \mathbf{x}$: a bowl opening upward, touching zero only at the origin. "Indefinite" is the saddle — up one way, down another.

**Sylvester as "nested corners":** take the top-left $1\times1$ corner, then the $2\times2$ corner, then the $3\times3$ — walk outward, and every determinant on the way must be strictly positive.

$$D_1 > 0, \quad D_2 > 0, \quad \ldots, \quad D_n = \det(A) > 0$$

**The free disqualifier — check the diagonal first.** Put $\mathbf{x} = \mathbf{e}_i$. Then $\mathbf{x}^T A \mathbf{x} = a_{ii}$, so every diagonal entry of a positive definite matrix must be positive. One zero or negative entry ends the question in two seconds. Necessary, not sufficient — use it to rule out, never to confirm.

**Sanity-check reflex:** all $\lambda_i > 0$ forces $\det(A) = \prod \lambda_i > 0$ and $\text{tr}(A) = \sum \lambda_i > 0$. A negative determinant on a symmetric matrix ends the question immediately.

```interactive-spec
{"v":1,"kind":"manipulable","title":"Drag a, b, d in A = [[a,b],[b,d]] — watch when both Sylvester determinants turn positive","why":"Sylvester's test is just two determinants. Drag the entries and watch D2 flip negative the moment the bowl tips into a saddle — that flip IS the boundary of positive definite.","inputs":[{"id":"a","label":"a","min":-5,"max":5,"step":0.5,"initial":3},{"id":"b","label":"b (off-diagonal)","min":-5,"max":5,"step":0.5,"initial":1},{"id":"d","label":"d","min":-5,"max":5,"step":0.5,"initial":2}],"outputs":[{"label":"D1 = a","formula":"a","digits":1},{"label":"D2 = ad - b^2","formula":"a*d - b^2","digits":2}],"caption":"Positive definite needs BOTH D1 > 0 and D2 > 0. Start at a=3, b=1, d=2 (D1=3, D2=5 — a genuine bowl), then push b up past 2 and watch D2 cross zero into a saddle, even though a and d never changed sign."}
```
