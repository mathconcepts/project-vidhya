---
id: eigenvalues.hook
concept_id: eigenvalues
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
---

Most matrices distort vectors when they act — stretching, rotating, shearing. But every matrix has special vectors it doesn't rotate at all. It only stretches them. Those are eigenvectors. The stretch factor is the eigenvalue. Find them and you've found the matrix's "skeleton."

```interactive-spec
{"v":1,"kind":"simulation","title":"The ellipse's own axes are the eigenvectors of [[2,1],[1,2]]","x_expr":"2*cos(t) + sin(t)","y_expr":"cos(t) + 2*sin(t)","t_min":0,"t_max":6.28319,"duration_sec":6,"view_box":{"x_min":-2.4,"x_max":2.4,"y_min":-2.4,"y_max":2.4},"caption":"Watch the long axis settle along (1,1) — the eigenvector for λ=3 — while the short axis along (1,-1) is λ=1, the direction the matrix stretches least."}
```
