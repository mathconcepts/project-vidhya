---
# Alternative body for limits.hook, served when the learner stance is
# `assured`. The fenced simulation is copied verbatim from the base atom
# so the widget cannot drift between variants; only prose differs.
id: limits.hook.assured
concept_id: limits
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: limits.hook
for_stance: assured
---

$\sin x/x\to 1$ as $x\to 0$ is already automatic. The distinction worth the marks: direct substitution failing at $\frac00$ tells you **nothing** about whether the limit exists — only that this particular method can't answer the question here. Reach for L'Hôpital's rule or a known standard limit next, not a conclusion that the limit itself is undefined. A limit's existence is independent of whether $f$ is even defined at the point; $\sin x/x$ has no value at $x=0$ and a perfectly well-defined limit there.

```interactive-spec
{"v":1,"kind":"simulation","title":"sin(x)/x closes in on 1 as x shrinks toward 0","x_expr":"t","y_expr":"sin(t)/t","t_min":-3.0,"t_max":-0.001,"duration_sec":7,"view_box":{"x_min":-3.3,"x_max":0.3,"y_min":-0.15,"y_max":1.15},"narration_steps":[{"at_progress":0.0,"text":"Far from zero, at x = -3, the ratio sin(x)/x is only 0.047 — barely off the axis.","text_shaken":"At x = -3: sin(-3)/(-3) = 0.047. Write it down.","text_assured":"sin(x)/x, traced as x approaches 0 from the left — a removable discontinuity, not a real one: the function is undefined at 0, the limit is not.","emphasize":false},{"at_progress":0.4,"text":"By x = -1.80, the ratio is already 0.541 — more than halfway to 1, purely from x shrinking.","text_shaken":"At x = -1.8: sin(-1.8)/(-1.8) = 0.541. The ratio rose 0.49 while x shrank by 1.2.","text_assured":"sin(x)/x to 1 is the base identity every trig limit reduces to — tan(x)/x, sin(kx)/x, all come back to this one.","emphasize":false},{"at_progress":0.7,"text":"The dashed line marks a guess: \"the limit is 0, since sin(0) = 0.\" Is that guess right, or does the traced ratio say otherwise?","text_shaken":"See the dashed line at y = 0? That's the guess: sin(0) = 0, so maybe the limit is 0. Is that guess right?","text_assured":"Direct substitution gives $0/0$ — undefined, not necessarily 0. Does that failure mean the limit is 0, or that this method can't answer here?"},{"at_progress":0.8,"text":"No — at x = -0.60 the real ratio is already 0.941: headed to 1, nowhere near 0. The dashed guess is wrong; substitution failing at 0/0 doesn't mean the limit is 0.","text_shaken":"No. At x = -0.6: sin(-0.6)/(-0.6) = 0.941, not 0. That guess has been wrong at every step shown so far.","text_assured":"Wrong guess. Direct substitution fails at 0/0 — that failure says nothing about whether the limit exists, only that this method can't answer it here.","trap":{"text":"Students see sin(0) = 0 and guess the limit is 0, ignoring what dividing by a shrinking x does to the ratio.","avoid":"Trace the ratio itself, not just the numerator — sin(x)/x climbs to 1, it does not fall to 0."}},{"at_progress":1.0,"text":"At x = -0.001, the ratio is 0.9999998 — as close to 1 as you like, though x = 0 itself is never reached. That is the limit.","text_shaken":"At x = -0.001: sin(-0.001)/(-0.001) = 0.9999998. Compute it yourself before trusting the memorized value of 1.","text_assured":"The limit is 1 exactly, by the squeeze theorem — not an approximation the trace happens to suggest, a proven equality.","emphasize":true}],"ghost":{"x_expr":"t","y_expr":"0"}}
```
