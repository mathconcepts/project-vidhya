---
# Alternative body for differentiability.hook, served when the learner
# stance is `assured`. The fenced simulation is copied verbatim from the
# base atom so the widget cannot drift between variants; only prose
# differs.
id: differentiability.hook.assured
concept_id: differentiability
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: differentiability.hook
for_stance: assured
---

$|x|$ having no derivative at $0$ isn't news. What actually costs marks: continuity is **necessary but not sufficient** for differentiability — every differentiable function is continuous, but the converse fails, and $|x|$ is only the mildest counterexample. A corner (mismatched one-sided slopes, like here) is the gentlest failure mode; a vertical tangent ($x^{1/3}$) and an oscillating derivative ($x^2\sin(1/x)$ patched at $0$) are two others, each continuous and each non-differentiable for a genuinely different reason. Don't collapse all three into "it has a sharp point" — only the corner case actually does.

```interactive-spec
{"v":1,"kind":"simulation","title":"|x| traced through its corner at x=0 — continuous, but the slope snaps","x_expr":"t","y_expr":"abs(t)","t_min":-2,"t_max":2,"duration_sec":8,"view_box":{"x_min":-2.3,"x_max":2.3,"y_min":-0.3,"y_max":2.3},"narration_steps":[{"at_progress":0.0,"text":"At x=-2, f(x)=2. Tracing rightward, the curve descends in a straight line with slope exactly -1.","text_shaken":"At x=-2: |-2|=2. The line here has slope -1 — every step right drops the height by the same amount.","text_assured":"f(x)=|x| is two linear pieces glued at the origin: slope -1 for x<0, slope +1 for x>0.","emphasize":false},{"at_progress":0.45,"text":"Still descending at slope -1 all the way to x=-0.1, where f is just 0.1 — the line has not curved even slightly.","text_shaken":"At x=-0.1: |-0.1|=0.1. Still perfectly straight, same slope -1 as at x=-2.","text_assured":"The left-hand derivative, computed as lim_{h to 0^-} (f(0+h)-f(0))/h, is exactly -1 all the way up to h=0.","emphasize":false},{"at_progress":0.5,"text":"At x=0 the curve touches bottom, height 0. Just left of 0 the slope was -1. Does the slope turn smoothly through this point, or snap instantly to a new value?","text_shaken":"At x=0: f(0)=0. Just left of 0 the slope was -1. In the next instant, does it ease toward a new value, or jump there in one step?","text_assured":"f(0)=0, left-hand derivative locked at -1. Does the right-hand derivative arrive at +1 gradually, or with a jump?","emphasize":false},{"at_progress":0.55,"text":"No transition — the slope becomes +1 instead of -1 instantly. Left and right derivatives disagree, so no single derivative exists at x=0.","text_shaken":"Just right of 0, the slope is +1 — no in-between value. Check: did it pass through any slope between -1 and +1? No, it jumped.","text_assured":"The right-hand derivative is +1, computed the same way from the right. Left (-1) and right (+1) disagree, so no single derivative exists at x=0.","emphasize":true,"trap":{"text":"Students see the curve is unbroken at x=0 and conclude it must be differentiable there too, treating \"continuous\" and \"differentiable\" as the same guarantee.","avoid":"Check the one-sided derivatives separately, not just the one-sided function values. Continuity only requires the values to agree; differentiability requires the SLOPES to agree too."}},{"at_progress":1.0,"text":"From x=0 to x=2, the curve climbs at a steady slope of +1 — a mirror image of the left side, meeting at a sharp corner instead of a smooth turn.","text_shaken":"At x=2: f(2)=2, slope +1 throughout. The whole curve is unbroken everywhere, but has exactly one corner: x=0.","text_assured":"f is continuous everywhere (no gaps) and differentiable everywhere except x=0 (one corner) — continuity is necessary for differentiability, never sufficient.","emphasize":true}]}
```
