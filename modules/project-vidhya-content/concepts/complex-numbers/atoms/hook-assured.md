---
# Alternative body for complex-numbers.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks rather than re-teaching what they can already do.
#
# The fenced interactive block below is copied verbatim from the base atom
# so the widget cannot drift between variants; only prose differs.
id: complex-numbers.hook.assured
concept_id: complex-numbers
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: complex-numbers.hook
for_stance: assured
---

The content behind $i=\sqrt{-1}$ isn't "a number whose square is negative exists" — algebraic extensions manage that routinely. It's that $\mathbb{C}\cong\mathbb{R}^2$ with multiplication built so that multiplying by $z=re^{i\theta}$ turns by $\theta$ and stretches by $r$, together, in one step. That's why $i^2=-1$: multiplying by $i$ rotates $90°$ twice, landing at $180°$ — exactly multiplication by $-1$, a geometric fact wearing an algebraic disguise.

```interactive-spec
{"v":1,"kind":"simulation","title":"A point of modulus 5 sweeps a full turn","x_expr":"5*cos(t)","y_expr":"5*sin(t)","t_min":0,"t_max":6.283185307179586,"duration_sec":8,"narration_steps":[{"at_progress":0,"text":"The point starts at (5, 0): five units out along the real axis.","text_shaken":"Start at (5, 0) — five units right of the origin, no height.","text_assured":"z0 = 5 on the positive real axis: modulus 5, argument 0.","emphasize":false},{"at_progress":0.3,"text":"As the point sweeps, its distance from the origin never changes — always exactly 5. That fixed distance is the modulus.","text_shaken":"Check the distance from the origin here: still 5. Only the direction moved.","emphasize":false},{"at_progress":0.65,"text":"The angle from the positive real axis keeps growing as the point sweeps — that changing angle is the argument.","text_assured":"theta climbs linearly; z(theta) = 5e^{i theta} — modulus fixed, argument the only free coordinate.","emphasize":true},{"at_progress":0.9,"text":"One full sweep, back to the start: the modulus stayed 5 throughout; only the argument travelled the full 2*pi.","trap":{"text":"Students read the point's own coordinates (a, b) off the picture and add them, treating a + b as the modulus.","avoid":"The modulus is sqrt(a^2+b^2), the Pythagorean sum of the coordinates, not their sum — here sqrt((5cos theta)^2+(5sin theta)^2) = 5 for every theta."}}]}
```
