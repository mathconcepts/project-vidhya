---
id: linear-transformations.visual_analogy
concept_id: linear-transformations
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.30
exam_ids: ["*"]
scaffold_fade: true
---

# Linear Transformations as Rotation

Imagine a **spotlight rotating on a stage**. The light starts pointing in one direction, then smoothly rotates to a new angle. Every point on the stage gets "mapped" to a new illuminated position. This is what a linear transformation does to vectors: it rotates, stretches, or reflects them in a structured, predictable way.

The key insight: the transformation **preserves relationships**. If two vectors point in the same direction, after rotation they still point in the same direction (just at a new angle). If one vector is twice as long as another, that ratio stays true after the transformation. This preservation of structure is what makes transformations "linear."

**In 2D**: A rotation by angle $\theta$ is given by the matrix $\begin{pmatrix} \cos\theta & -\sin\theta \\ \sin\theta & \cos\theta \end{pmatrix}$. The cosine wave on this card rotates and shifts as the parameter $t$ changes—this animation shows the same principle: the transformation evolves smoothly, always respecting the linear structure.

```gif-scene
{"type":"parametric","expression":"cos(x)*cos(t)-sin(x)*sin(t)","x_range":[-3.14159,3.14159],"y_range":[-1.5,1.5],"t_range":[0,6.28],"frames":30,"fps":12}
```
