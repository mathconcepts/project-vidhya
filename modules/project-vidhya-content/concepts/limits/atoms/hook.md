---
id: limits.hook
concept_id: limits
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
---

$\dfrac{\sin x}{x}$ is undefined at $x=0$ — dividing by zero is not negotiable. Yet feed in $0.1$, then $0.01$, then $0.001$, and the outputs march steadily toward $1$. Before tracing a single further value, guess where this is headed as $x$ keeps shrinking. What a function equals at a point and what it is heading toward as you approach that point are two different questions — a function can refuse to answer the first and still answer the second cleanly. A limit is the second question, formalized.

```interactive-spec
{"v":1,"kind":"simulation","title":"sin(x)/x closes in on 1 as x shrinks toward 0","x_expr":"t","y_expr":"sin(t)/t","t_min":-3.0,"t_max":-0.001,"duration_sec":7,"view_box":{"x_min":-3.3,"x_max":0.3,"y_min":-0.15,"y_max":1.15},"narration_steps":[{"at_progress":0.0,"text":"Far from zero, at x = -3, the ratio sin(x)/x is only 0.047 — barely off the axis.","text_shaken":"At x = -3: sin(-3)/(-3) = 0.047. Write it down.","text_assured":"sin(x)/x, traced as x approaches 0 from the left — a removable discontinuity, not a real one: the function is undefined at 0, the limit is not.","emphasize":false},{"at_progress":0.4,"text":"By x = -1.80, the ratio is already 0.541 — more than halfway to 1, purely from x shrinking.","text_shaken":"At x = -1.8: sin(-1.8)/(-1.8) = 0.541. The ratio rose 0.49 while x shrank by 1.2.","text_assured":"sin(x)/x to 1 is the base identity every trig limit reduces to — tan(x)/x, sin(kx)/x, all come back to this one.","emphasize":false},{"at_progress":0.8,"text":"The dashed line is the guess \"the limit is 0, since sin(0) = 0.\" But at x = -0.60 the real ratio is already 0.941 — headed to 1, nowhere near 0.","text_shaken":"At x = -0.6: sin(-0.6)/(-0.6) = 0.941, not 0. That guess has been wrong at every step shown so far.","text_assured":"Direct substitution fails at 0/0 — that failure says nothing about whether the limit exists, only that this method can't answer it here.","trap":{"text":"Students see sin(0) = 0 and guess the limit is 0, ignoring what dividing by a shrinking x does to the ratio.","avoid":"Trace the ratio itself, not just the numerator — sin(x)/x climbs to 1, it does not fall to 0."}},{"at_progress":1.0,"text":"At x = -0.001, the ratio is 0.9999998 — as close to 1 as you like, though x = 0 itself is never reached. That is the limit.","text_shaken":"At x = -0.001: sin(-0.001)/(-0.001) = 0.9999998. Compute it yourself before trusting the memorized value of 1.","text_assured":"The limit is 1 exactly, by the squeeze theorem — not an approximation the trace happens to suggest, a proven equality.","emphasize":true}],"ghost":{"x_expr":"t","y_expr":"0"}}
```
