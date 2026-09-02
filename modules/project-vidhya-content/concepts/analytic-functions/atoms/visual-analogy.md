---
id: analytic-functions.visual_analogy
concept_id: analytic-functions
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
modality: visual
---

$u=x^2-y^2$ and $v=2xy$ are the real and imaginary parts of the analytic function $z^2$ — and CR analyticity forces something visible: the level curves of $u$ and the level curves of $v$ cross each other at right angles everywhere they meet. $u$'s curves are one family of hyperbolas; $v$'s are a second family, rotated $45°$ from the first.

That perpendicularity isn't a coincidence of this one example — it's a direct consequence of $u_x=v_y$ and $u_y=-v_x$: the gradient of $u$ and the gradient of $v$ are always perpendicular wherever $f$ is analytic. Harmonic conjugates cross at right angles, every time.

```gif-scene
{"type":"level-set","expression":"x^2 - y^2","expression2":"2*x*y","x_range":[-3,3],"y_range":[-3,3],"title":"u = x^2-y^2 and v = 2xy: orthogonal harmonic families"}
```
