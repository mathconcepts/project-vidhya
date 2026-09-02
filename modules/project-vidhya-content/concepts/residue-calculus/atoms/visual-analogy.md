---
id: residue-calculus.visual_analogy
concept_id: residue-calculus
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
modality: visual
---

The residue theorem lets a contour shrink to the smallest loop that still isolates a single pole — the value of the integral doesn't change as long as no other singularity crosses the boundary on the way in. Below is exactly that: a tiny loop drawn around one isolated pole, small enough to enclose nothing else.

Whatever the original contour looked like, this shrunk loop carries the same answer for that one pole's contribution — which is why residue calculus never needs the literal shape of the original path, only which poles end up trapped inside it.

```gif-scene
{"type":"parametric-curve","x_expr":"0.5*cos(s)","y_expr":"0.5*sin(s)","s_range":[0,6.283185307179586],"x_range":[-1,1],"y_range":[-1,1],"frames":30,"fps":12,"title":"Small loop isolating one pole"}
```
