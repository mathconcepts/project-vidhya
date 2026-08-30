---
id: orthogonality.hook
concept_id: orthogonality
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
---

Push a crate due north. How much of that push moved it east? None at all — and that is what orthogonal means, made operational. The test is a single multiplication: the dot product comes out zero. Build a whole basis that way and the messy simultaneous equations you would otherwise be solving collapse into a handful of independent dot products.

```interactive-spec
{"v":1,"kind":"simulation","title":"Two orthogonal frequencies: cos(t) against cos(2t)","x_expr":"cos(t)","y_expr":"cos(2*t)","t_min":0,"t_max":6.28319,"duration_sec":6,"view_box":{"x_min":-1.3,"x_max":1.3,"y_min":-1.3,"y_max":1.3},"narration_steps":[{"at_progress":0,"text":"Horizontal is cos(t); vertical is cos(2t). Two signals, plotted against each other rather than against time.","text_shaken":"x-axis: $\\cos(t)$. y-axis: $\\cos(2t)$. Same clock, two different signals, plotted against each other.","text_assured":"A phase portrait, not a time series — the loop's shape carries the orthogonality test, not either trace alone.","emphasize":false},{"at_progress":0.25,"text":"cos(t) has fallen to zero while cos(2t) has run all the way down to -1. They are not moving together at all.","text_shaken":"At $t=\\pi/2$: $\\cos(t)=0$ exactly, $\\cos(2t)=-1$ exactly. One is at zero exactly when the other is most extreme.","text_assured":"Zero at one instant doesn't prove orthogonality by itself — that needs the integral over the whole period, not a snapshot.","emphasize":false},{"at_progress":0.55,"text":"Across one full period their product integrates to exactly zero — every positive overlap is cancelled by a negative one.","text_shaken":"Add $\\cos(t)\\cos(2t)$ across the whole loop: positive stretches and negative stretches cancel to exactly $0$.","text_assured":"$\\int_0^{2\\pi}\\cos(t)\\cos(2t)\\,dt=0$ is the actual test; looking different is not the same as this integral vanishing.","emphasize":true,"trap":{"text":"Students treat 'these two curves look different' as proof of orthogonality; being independent (neither a multiple of the other) is necessary but nowhere near sufficient.","avoid":"Always compute the inner product (or dot product) itself; never infer orthogonality from curves merely looking distinct."}},{"at_progress":0.85,"text":"That zero is the same statement as a dot product of zero. Orthogonal — just in a space of functions instead of arrows.","text_shaken":"Same test as vectors: multiply matching pieces, add them up (here, integrate), get zero.","text_assured":"The inner product $\\langle f,g\\rangle=\\int fg\\,dt$ generalizes the dot product — same zero-overlap test, wider space.","emphasize":false}]}
```
