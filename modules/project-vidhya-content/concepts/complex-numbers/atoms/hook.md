---
id: complex-numbers.hook
concept_id: complex-numbers
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
---

Asked "what is the square root of $-1$?", mathematicians spent centuries answering "it doesn't exist." Someone wrote $i$ down anyway, and an entire plane fell out of arithmetic: every complex number is a point, and multiplying by one rotates and scales every other point at once. Below, a point sitting 5 units from the origin sweeps one full turn — watch which of its two numbers never moves.

```interactive-spec
{"v":1,"kind":"simulation","title":"A point of modulus 5 sweeps a full turn","x_expr":"5*cos(t)","y_expr":"5*sin(t)","t_min":0,"t_max":6.283185307179586,"duration_sec":8,"narration_steps":[{"at_progress":0,"text":"The point starts at (5, 0): five units out along the real axis.","text_shaken":"Start at (5, 0) — five units right of the origin, no height.","text_assured":"z0 = 5 on the positive real axis: modulus 5, argument 0.","emphasize":false},{"at_progress":0.3,"text":"As the point sweeps, its distance from the origin never changes — always exactly 5. That fixed distance is the modulus.","text_shaken":"Check the distance from the origin here: still 5. Only the direction moved.","emphasize":false},{"at_progress":0.65,"text":"The angle from the positive real axis keeps growing as the point sweeps — that changing angle is the argument.","text_assured":"theta climbs linearly; z(theta) = 5e^{i theta} — modulus fixed, argument the only free coordinate.","emphasize":true},{"at_progress":0.9,"text":"One full sweep, back to the start: the modulus stayed 5 throughout; only the argument travelled the full 2*pi.","trap":{"text":"Students read the point's own coordinates (a, b) off the picture and add them, treating a + b as the modulus.","avoid":"The modulus is sqrt(a^2+b^2), the Pythagorean sum of the coordinates, not their sum — here sqrt((5cos theta)^2+(5sin theta)^2) = 5 for every theta."}}]}
```
