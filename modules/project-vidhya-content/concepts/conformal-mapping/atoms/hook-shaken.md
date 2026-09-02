---
# Alternative body for conformal-mapping.hook, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling.
#
# The fenced interactive block below is copied verbatim from the base atom
# so the widget cannot drift between variants; only prose differs.
id: conformal-mapping.hook.shaken
concept_id: conformal-mapping
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: conformal-mapping.hook
for_stance: shaken
---

Take two lines crossing at $90°$, and apply $f(z)=iz$: every point rotates by $90°$ together, so the two lines still cross at $90°$ afterward — the angle survived even though every point moved. That's conformal: angles preserved, not lengths. Below, watch a circle map to a smaller circle under a different function, $w=1/z$.

```interactive-spec
{"v":1,"kind":"simulation","title":"Image of |z|=2 under w = 1/z","x_expr":"0.5*cos(t)","y_expr":"-0.5*sin(t)","t_min":0,"t_max":6.283185307179586,"duration_sec":8,"narration_steps":[{"at_progress":0,"text":"A point sweeps once, counterclockwise, around the circle |z| = 2 in the z-plane. Drawn here is its image under w = 1/z.","text_shaken":"The original point travels counterclockwise around a circle of radius 2. This picture shows only where 1/z sends it.","emphasize":false},{"at_progress":0.3,"text":"A quarter of the way around the original loop, the image has swept a quarter of its own loop too — but the other way.","emphasize":false},{"at_progress":0.65,"text":"One full trip around the original circle takes the image exactly once around its own circle, clockwise instead of counterclockwise — one wrap in, one wrap out.","text_assured":"|1/z| = 1/|z| and arg(1/z) = -arg(z): the radius inverts, the direction of travel reverses. Both facts, at once.","emphasize":true},{"at_progress":0.9,"text":"Back at the start: the image circle is smaller, and it was traced in the reverse direction the whole way.","trap":{"text":"Students see the smaller image circle and read the whole map as a plain contraction, uniform shrinking and nothing else.","avoid":"Only the radius shrank (2 to 1/2, since |1/z| = 1/|z|); the direction of travel also reversed (arg(1/z) = -arg z) — one map, two separate effects at once, not a single uniform shrink."}}]}
```
