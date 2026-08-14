---
id: matrix-norms.visual_analogy
concept_id: matrix-norms
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.2
modality: visual
exam_ids: ["*"]
---

Think of a matrix $A$ as a stretching or squashing transformation of vectors. The spectral norm $\|A\|_2$ is the **maximum stretch factor**: if you imagine a unit circle of input vectors and ask "how far does each one get stretched?", the farthest one gets stretched by $\|A\|_2$ and the nearest by $\sigma_{\min}(A)$. The condition number $\kappa(A) = \sigma_{\max} / \sigma_{\min}$ measures the **ratio of extreme stretches**. A well-conditioned matrix stretches all directions by similar amounts, so errors are balanced. An ill-conditioned matrix is like a thin pancake: it stretches some directions far and others barely — so small input noise in the "thin" direction produces huge output error.

```gif-scene
{"type":"function-trace","expression":"x**3 - 2*x","x_range":[-2,2],"y_range":[-5,5],"frames":30,"fps":12}
```