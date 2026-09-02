---
id: matrix-norms.visual_analogy
concept_id: matrix-norms
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.2
exam_ids: ["*"]
modality: visual
---

Feed the unit circle through $A=\begin{pmatrix}4&1\\0&2\end{pmatrix}$ and it traces an ellipse. The ellipse's long semi-axis has length $\sigma_1\approx4.16=\|A\|_2$; its short semi-axis has length $\sigma_2\approx1.92$. The ratio between them, $\kappa_2(A)=\sigma_1/\sigma_2\approx2.16$, is exactly how elongated the ellipse looks.

A well-conditioned matrix turns the circle into something close to circular — every direction survives about equally. An ill-conditioned matrix turns it into a long, thin sliver: one direction barely moves while another stretches far, and that imbalance is exactly what floods back as error when you invert $A$.

```gif-scene
{"type": "parametric-curve", "x_expr": "4*cos(s)+sin(s)", "y_expr": "2*sin(s)", "s_range": [0, 6.283185307], "x_range": [-5, 5], "y_range": [-3, 3]}
```
