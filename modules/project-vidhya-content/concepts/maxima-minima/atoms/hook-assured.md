---
# Alternative body for maxima-minima.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: maxima-minima.hook.assured
concept_id: maxima-minima
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: maxima-minima.hook
for_stance: assured
---

Finding the absolute max/min on $[a,b]$ is a closed-interval-method question on GATE, not a bare critical-point question. The failure mode under pressure: solving $f'(x)=0$, evaluating only those points, and reporting the largest as the answer, silently skipping the endpoints $a$ and $b$. An absolute extremum can sit at an endpoint with no critical point there at all — the closed interval method exists exactly because critical points are not the whole candidate list.

```interactive-spec
{"v":1,"kind":"simulation","title":"f(x) = x³-3x on [-2,2]: endpoints matter as much as critical points","why":"f=x³−3x turns at x=−1 (peak) and x=1 (valley), but the true global max/min also has to check the endpoints — not just wherever the derivative is zero.","x_expr":"t","y_expr":"t^3-3*t","t_min":-2,"t_max":2,"duration_sec":7,"view_box":{"x_min":-2.3,"x_max":2.3,"y_min":-2.6,"y_max":2.6},"narration_steps":[{"at_progress":0.0,"focus_point":true,"text":"At the left endpoint x=-2, f(x)=x³-3x equals -2. As x increases from here, predict: does f climb the whole way to x=2, or does it turn around somewhere first?","text_shaken":"At x=-2: f(-2)=(-2)³-3(-2)=-8+6=-2. Write it down as the starting value.","text_assured":"f(-2)=-2 — the endpoint value, not yet the question; the question is what happens between here and x=2."},{"at_progress":0.25,"focus_point":true,"text":"By x=-1, f has climbed to 2 — and f'(x)=3x²-3 is exactly 0 here, the tangent goes flat.","text_shaken":"At x=-1: f(-1)=(-1)+3=2. f'(-1)=3(1)-3=0 — flat tangent.","text_assured":"f(-1)=2, f'(-1)=0 — a candidate extremum, not yet classified as max or min."},{"at_progress":0.5,"focus_point":true,"text":"At x=0, f has fallen back to 0 — past the flat point at x=-1, it turned and started descending. Some students stop checking once they find one critical point and report its value as the answer.","text_shaken":"At x=0: f(0)=0-0=0 — lower than f(-1)=2. The value dropped after x=-1, so x=-1 was a peak, not the global answer by itself.","text_assured":"f(0)=0. One critical point evaluated is not the closed interval method — every candidate still needs checking.","trap":{"text":"Students find one critical point, evaluate f there, and report it as the global extremum without checking the other critical point or either endpoint.","avoid":"The closed interval method requires every critical point AND both endpoints on the candidate list — the global max or min can sit at any of them, not just the first one found."}},{"at_progress":0.75,"focus_point":true,"text":"By x=1, f has fallen to -2 — another flat tangent, f'(1)=3(1)-3=0, and this one is a valley, not a peak.","text_shaken":"At x=1: f(1)=1-3=-2. f'(1)=3-3=0 — flat again, but this time f fell into it from above.","text_assured":"f(1)=-2, f'(1)=0 — the second candidate, a mirror valley to the peak at x=-1."},{"at_progress":1.0,"focus_point":true,"emphasize":true,"text":"At the right endpoint x=2, f is back up to 2 — tied with the peak at x=-1. Comparing all four candidates {-2,2,-2,2}: global maximum 2 (at x=-1 and x=2), global minimum -2 (at x=-2 and x=1) — endpoints mattered as much as critical points.","text_shaken":"At x=2: f(2)=8-6=2. Compare all four: f(-2)=-2, f(-1)=2, f(1)=-2, f(2)=2. Largest is 2 (twice), smallest is -2 (twice) — both ties include an endpoint.","text_assured":"f(2)=2, tying the interior max. The global extrema are decided by all four candidates together, endpoints included — not by the critical points alone."}]}
```
