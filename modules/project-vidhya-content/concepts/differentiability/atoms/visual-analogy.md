---
id: differentiability.visual_analogy
concept_id: differentiability
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.15
exam_ids: ["*"]
modality: visual
---

Trace $f(x)=|x|$ across a window centered on the origin. The two halves are dead straight — no curving anywhere — and meet at the bottom in a sharp point, like a tent pole planted at $x=0$. Nothing about the curve is broken there: you can trace along it without lifting your finger. What's broken is the *direction* your finger is moving in the instant it crosses the point — steadily downward one moment, steadily upward the very next, with no smooth turn in between. A parabola bends gradually through every one of its points; this curve refuses to bend at all anywhere except at the one sharp corner, where it changes direction instantly instead.

```gif-scene
{"type":"function-trace","expression":"abs(x)","x_range":[-3,3],"y_range":[-0.5,3.2]}
```
