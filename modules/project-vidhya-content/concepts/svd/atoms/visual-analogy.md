---
id: svd.visual_analogy
concept_id: svd
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.2
modality: visual
exam_ids: ["*"]
---

Think of a matrix $A$ as choreography. A dancer (the unit circle) enters the stage. First, the music rotates them via $V^T$. Then, the spotlight stretches them along the cardinal axes — some directions amplify loudly ($\sigma_1$), others barely glow ($\sigma_2$). Finally, the stage itself rotates them into a new pose (via $U$). The three factors are the three acts of this performance, and the singular values are the intensity knobs. This is why images compress so well with SVD: tiny singular values correspond to near-invisible details you can safely throw away.

The diagram on this card traces exactly this: the unit circle, after the shear $\begin{pmatrix}1&1\\0&1\end{pmatrix}$ acts on it, becomes an ellipse whose long and short semi-axes are the singular values $\varphi\approx1.618$ and $1/\varphi\approx0.618$ — the golden ratio and its reciprocal, for this particular shear.

```gif-scene
{"type":"parametric-curve","x_expr":"cos(s) + sin(s)","y_expr":"sin(s)","s_range":[0, 6.28318],"x_range":[-1.8,1.8],"y_range":[-1.2,1.2],"frames":30,"fps":12}
```
