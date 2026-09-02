---
# Alternative body for limits.hook, served when the learner stance is
# `shaken`. Concrete-first, full arithmetic, explicit check, no
# reassurance language.
id: limits.hook.shaken
concept_id: limits
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: limits.hook
for_stance: shaken
---

Compute $\dfrac{\sin x}{x}$ at three values. $x=0.1$: $\dfrac{\sin(0.1)}{0.1}\approx 0.9983$. $x=0.01$: $\approx 0.99998$. $x=0.001$: $\approx 0.9999998$. Each value is closer to $1$ than the last. Check: is $x=0$ itself ever used? No — every input is a small nonzero number. The outputs approach $1$ without $x$ ever reaching $0$, and $\dfrac{\sin x}{x}$ is undefined exactly at $0$ regardless. Approaching a value and equaling it are different facts; a limit records the first one.

```interactive-spec
{"v":1,"kind":"simulation","title":"sin(x)/x closes in on 1 as x shrinks toward 0","x_expr":"t","y_expr":"sin(t)/t","t_min":-3.0,"t_max":-0.001,"duration_sec":7,"view_box":{"x_min":-3.3,"x_max":0.3,"y_min":-0.15,"y_max":1.15},"narration_steps":[{"at_progress":0.0,"text":"Far from zero, at x = -3, the ratio sin(x)/x is only 0.047 — barely off the axis.","text_shaken":"At x = -3: sin(-3)/(-3) = 0.047. Write it down.","text_assured":"sin(x)/x, traced as x approaches 0 from the left — a removable discontinuity, not a real one: the function is undefined at 0, the limit is not.","emphasize":false},{"at_progress":0.4,"text":"By x = -1.80, the ratio is already 0.541 — more than halfway to 1, purely from x shrinking.","text_shaken":"At x = -1.8: sin(-1.8)/(-1.8) = 0.541. The ratio rose 0.49 while x shrank by 1.2.","text_assured":"sin(x)/x to 1 is the base identity every trig limit reduces to — tan(x)/x, sin(kx)/x, all come back to this one.","emphasize":false},{"at_progress":0.8,"text":"The dashed line is the guess \"the limit is 0, since sin(0) = 0.\" But at x = -0.60 the real ratio is already 0.941 — headed to 1, nowhere near 0.","text_shaken":"At x = -0.6: sin(-0.6)/(-0.6) = 0.941, not 0. That guess has been wrong at every step shown so far.","text_assured":"Direct substitution fails at 0/0 — that failure says nothing about whether the limit exists, only that this method can't answer it here.","trap":{"text":"Students see sin(0) = 0 and guess the limit is 0, ignoring what dividing by a shrinking x does to the ratio.","avoid":"Trace the ratio itself, not just the numerator — sin(x)/x climbs to 1, it does not fall to 0."}},{"at_progress":1.0,"text":"At x = -0.001, the ratio is 0.9999998 — as close to 1 as you like, though x = 0 itself is never reached. That is the limit.","text_shaken":"At x = -0.001: sin(-0.001)/(-0.001) = 0.9999998. Compute it yourself before trusting the memorized value of 1.","text_assured":"The limit is 1 exactly, by the squeeze theorem — not an approximation the trace happens to suggest, a proven equality.","emphasize":true}],"ghost":{"x_expr":"t","y_expr":"0"}}
```
