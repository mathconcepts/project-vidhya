---
id: svd.visual_analogy
concept_id: svd
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.2
modality: visual
exam_ids: ["*"]
---

## SVD as a Dance: Rotation → Stretch → Rotation

Think of a matrix $A$ as choreography. A dancer (the unit circle) enters the stage. First, the music rotates them via $V^T$. Then, the spotlight stretches them along the cardinal axes—some directions amplify loudly ($\sigma_1, \sigma_2$), others barely glow ($\sigma_3, \sigma_4$). Finally, the stage itself rotates them into a new pose (via $U$). The three factors are the three acts of this performance, and the singular values are the intensity knobs. This is why images compress so well with SVD: the tiny singular values correspond to near-invisible details you can safely throw away.

```gif-scene
{"type": "parametric", "x_expr": "0.5*t*cos(s)", "y_expr": "0.3*t*sin(s)", "t_range": [0, 1], "s_range": [0, 6.28], "frames": 24, "fps": 12}
```