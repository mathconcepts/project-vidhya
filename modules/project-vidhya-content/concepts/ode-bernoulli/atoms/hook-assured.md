---
# Alternative body for ode-bernoulli.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: ode-bernoulli.hook.assured
concept_id: ode-bernoulli
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: ode-bernoulli.hook
for_stance: assured
---

The nonlinearity lives entirely in the exponent $n$ on $y$. Confirm $n \neq 0, 1$ before reaching for $v = y^{1-n}$ — at $n = 0$ the equation is already linear, at $n = 1$ it's separable, and the substitution below is wasted effort on either.

```interactive-spec
{
  "v": 1,
  "kind": "simulation",
  "title": "Bernoulli blow-up: y' - y = xy^2",
  "why": "The y^2 term doesn't just add extra growth - it makes v = 1/y hit zero at a finite x, and that's the real reason y explodes there instead of climbing forever like an ordinary exponential.",
  "x_expr": "t",
  "y_expr": "1/(1-t)",
  "t_min": 0,
  "t_max": 0.9,
  "duration_sec": 6,
  "view_box": {"x_min": -0.05, "x_max": 0.95, "y_min": -0.5, "y_max": 9.5},
  "caption": "y = 1/(1-x): the Bernoulli solution of y' - y = xy^2, starting at y(0) = 1.",
  "narration_steps": [
    {"at_progress": 0.1111, "text": "At x = 0.1, y is barely above where it started (y = 1 at x = 0). The right side has a y^2 term feeding back into its own growth - does y keep climbing smoothly all the way to x = 1, or does something change before it gets there?"},
    {"at_progress": 0.5556, "text": "Halfway to x = 1, y has only reached 2 - still a normal-looking rise, nothing dramatic yet.", "focus_point": true},
    {"at_progress": 0.8889, "text": "By x = 0.8, y has jumped to 5 - the climb has visibly steepened, and it keeps steepening from here on, faster than any plain exponential ever would.", "emphasize": true},
    {"at_progress": 0.9778, "text": "The Bernoulli substitution turns this into a straight line for v = 1/y: v = 1 - x. That line hits zero exactly at x = 1, and since y = 1/v, y must blow up there - the y^2 term creates a real breaking point, not just extra growth.", "trap": {"text": "students see the y^2 term and read it as simply making the curve grow a bit faster than a plain linear ODE would", "avoid": "check the linearized v = 1/y instead - here v = 1 - x is a straight line, and where it crosses zero is exactly where y blows up; a linear ODE's solution is a pure exponential and never crosses zero - this blow-up is the Bernoulli nonlinearity's signature, not just extra growth"}}
  ]
}
```
