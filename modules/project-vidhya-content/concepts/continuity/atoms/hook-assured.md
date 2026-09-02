---
# Alternative body for continuity.hook, served when the learner stance is
# `assured`. The fenced simulation is copied verbatim from the base atom
# so the widget cannot drift between variants; only prose differs.
id: continuity.hook.assured
concept_id: continuity
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: continuity.hook
for_stance: assured
---

$f(x)=\frac{x^2-4}{x-2}$ simplifying to $x+2$ away from $x=2$ is routine algebra. The distinction worth the marks: "undefined at one point" and "discontinuous everywhere" are not the same claim, and treating a single bad point as evidence of global misbehavior is exactly the wrong generalization. A rational function's domain issues are almost always local — check the specific point the formula breaks at, not the formula's overall shape, before concluding anything about the rest of the curve.

```interactive-spec
{"v":1,"kind":"simulation","title":"(x^2-4)/(x-2) traced toward x=2 — smooth everywhere but one point","x_expr":"t","y_expr":"(t*t-4)/(t-2)","t_min":0,"t_max":1.98,"duration_sec":8,"view_box":{"x_min":-0.3,"x_max":2.6,"y_min":1.5,"y_max":4.5},"narration_steps":[{"at_progress":0.0,"text":"At x = 0, f(x) = (0-4)/(0-2) = 2. Nothing unusual — an ordinary point on an ordinary curve.","text_shaken":"At x = 0: (0^2-4)/(0-2) = -4/-2 = 2. Compute it yourself.","text_assured":"f(x) = (x^2-4)/(x-2) simplifies algebraically to x+2 for every x != 2 — the curve traced here IS the line y = x+2, minus one point.","emphasize":false},{"at_progress":0.5,"text":"At x = 1, f(x) = -3/-1 = 3. The curve is climbing in a perfectly straight line, no surprises yet.","text_shaken":"At x = 1: (1-4)/(1-2) = -3/-1 = 3. Same straight climb as before.","text_assured":"Every value traced so far equals x + 2 exactly — the cancellation (x-2) in numerator and denominator is legal for every x on this path, since none of them equal 2.","emphasize":false},{"at_progress":0.92,"text":"At x = 1.96, f(x) = 3.96 — the curve keeps climbing in that same straight line, heading toward 4.","text_shaken":"At x = 1.96: (1.96^2-4)/(1.96-2) = 3.96. Still exactly on the line y = x+2.","text_assured":"The limit as x approaches 2 is 4 — but f(2) itself cannot be computed from this formula at all: 0/0.","trap":{"text":"Students assume a formula with a division problem is broken everywhere, or conclude the function is simply undefined and stop analysing it.","avoid":"Check the domain point by point: f is undefined only exactly at x=2. Everywhere else, including arbitrarily close to 2, the formula works fine and the curve is a straight line."}},{"at_progress":1.0,"text":"At x=2 the curve has an open hole exactly at height 4 — the point that would complete the line is missing, though every point around it agrees on where it should be.","text_shaken":"At x=2: 0/0, undefined. But the trend from both directions points at height 4. Write that down as the limit — not as f(2), which does not exist.","text_assured":"This is the textbook shape of a removable discontinuity: the limit exists (4), the function value does not — redefining f(2)=4 would make f continuous everywhere.","emphasize":true}]}
```
