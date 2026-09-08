---
# Alternative body for complex-integration.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks rather than re-teaching what they can already do.
id: complex-integration.hook.assured
concept_id: complex-integration
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: complex-integration.hook
for_stance: assured
---

Path-independence needs two things together, and problems test dropping either silently: $f$ analytic at every point *inside and on* $C$, and the enclosed region free of singularities — an outer contour that looks like a simple closed curve is not automatically hole-free if something sits in the region it bounds. $\oint_{|z|=2}\frac{dz}{z}=2\pi i\neq0$: $1/z$ is perfectly well-behaved on the circle $|z|=2$ itself, but the theorem still fails because $z=0$ sits inside it. The animation below traces exactly this loop, tracking the enclosed singularity through the whole sweep.

```interactive-spec
{"v":1,"kind":"simulation","title":"The loop |z| = 2 with the singularity of 1/z trapped inside","x_expr":"2*cos(t)","y_expr":"2*sin(t)","t_min":0,"t_max":6.283185307179586,"duration_sec":8,"why":"Traces the loop |z|=2 from this concept's own contour example, showing the pole at z=0 stays trapped inside the whole way — why Cauchy's theorem can't force this integral to zero.","narration_steps":[{"at_progress":0.0,"text":"This loop is |z| = 2, starting at (2, 0) and sweeping once counterclockwise. Somewhere inside it sits z = 0, where 1/z has no value at all. Does integrating 1/z around this loop still come out 0, the way Cauchy's theorem gives when nothing is enclosed?","text_shaken":"This loop is |z| = 2, starting at (2, 0). Inside it sits z = 0, where 1/z blows up. Does the integral of 1/z around this loop still come out 0?","text_assured":"|z| = 2 traced from (2, 0), enclosing the singularity of 1/z at z = 0 — does Cauchy's theorem still force this integral to 0?","emphasize":false,"focus_point":true},{"at_progress":0.25,"text":"A quarter of the way around, at (0, 2) — still tracing the same loop, and z = 0 is still sitting inside it.","text_shaken":"A quarter turn in, at (0, 2). z = 0 is still trapped inside this same loop.","text_assured":"Quarter turn: (0, 2). The origin remains enclosed throughout.","emphasize":false,"focus_point":true},{"at_progress":0.5,"text":"Halfway around, at (-2, 0). The origin has stayed trapped inside this loop for the entire trip so far — it never gets the chance to leave.","text_shaken":"Halfway around, at (-2, 0). z = 0 has stayed inside the whole time.","text_assured":"Halfway: (-2, 0). z = 0 remains enclosed for the full sweep — no half-trip where it briefly sits outside.","emphasize":false,"focus_point":true},{"at_progress":0.75,"text":"That's exactly why the integral of 1/z around this loop is 2*pi*i, not 0: Cauchy's theorem promises 0 only when NOTHING sits inside the closed contour. Here z = 0 sits inside for the whole trip, so the theorem simply doesn't apply.","text_shaken":"This is why the integral isn't 0: Cauchy's theorem needs the whole inside to be free of singularities. Here z = 0 sits inside the entire time, so the theorem can't apply.","text_assured":"Hence the integral is 2*pi*i, not 0 — Cauchy's theorem requires the ENCLOSED region singularity-free, and z = 0 fails that for the entire sweep.","emphasize":true},{"at_progress":0.9,"text":"Back at the start: the origin was inside this loop for every instant of the trip, start to finish.","trap":{"text":"Students see that 1/z is perfectly well-defined at every point ON this circle (|z| = 2 never touches z = 0) and conclude the function is 'analytic enough' for Cauchy's theorem to give 0.","avoid":"Cauchy's theorem needs analyticity throughout the ENCLOSED region, not just on the boundary curve — z = 0 sits inside |z| = 2 even though it never sits on the circle itself, and that enclosure alone is why the integral is 2*pi*i, not 0."}}]}
```
