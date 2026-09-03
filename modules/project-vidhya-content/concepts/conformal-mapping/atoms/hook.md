---
id: conformal-mapping.hook
concept_id: conformal-mapping
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
---

Stretch and twist a rubber sheet ruled with a square grid. Lengths distort wildly. But if every crossing on that grid still meets at a right angle, the map you applied is conformal. Watch a point sweep once around a circle below — its image sweeps a circle too, at a different radius, in the opposite direction.

```interactive-spec
{"v":1,"kind":"simulation","title":"Image of |z|=2 under w = 1/z","x_expr":"0.5*cos(t)","y_expr":"-0.5*sin(t)","t_min":0,"t_max":6.283185307179586,"duration_sec":8,"narration_steps":[{"at_progress":0,"text":"A point sweeps once, counterclockwise, around the circle |z| = 2 in the z-plane. Drawn here is its image under w = 1/z.","text_shaken":"The original point travels counterclockwise around a circle of radius 2. This picture shows only where 1/z sends it.","emphasize":false},{"at_progress":0.3,"text":"A quarter of the way around the original loop, the image has swept a quarter of its own loop too. Does it sweep the same direction as the original point, or the opposite way?","text_shaken":"The image has moved a quarter of the way around its own loop too. Same direction as the original, or opposite?","text_assured":"A quarter-turn in for the original — is the image's quarter-turn the same rotational sense, or reversed?","emphasize":false},{"at_progress":0.45,"text":"The opposite way — as the original point sweeps counterclockwise, its image sweeps clockwise. Direction reverses under w = 1/z.","text_shaken":"Opposite. The original goes counterclockwise; the image goes clockwise. Direction flips under w = 1/z.","text_assured":"arg(1/z) = -arg(z) — direction reverses; confirmed live, not just from the formula.","emphasize":false},{"at_progress":0.65,"text":"One full trip around the original circle takes the image exactly once around its own circle, clockwise instead of counterclockwise — one wrap in, one wrap out.","text_assured":"|1/z| = 1/|z| and arg(1/z) = -arg(z): the radius inverts, the direction of travel reverses. Both facts, at once.","emphasize":true},{"at_progress":0.9,"text":"Back at the start: the image circle is smaller, and it was traced in the reverse direction the whole way.","trap":{"text":"Students see the smaller image circle and read the whole map as a plain contraction, uniform shrinking and nothing else.","avoid":"Only the radius shrank (2 to 1/2, since |1/z| = 1/|z|); the direction of travel also reversed (arg(1/z) = -arg z) — one map, two separate effects at once, not a single uniform shrink."}}]}
```
