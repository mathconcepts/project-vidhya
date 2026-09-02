---
# Alternative body for numerical-ode.worked_example, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: numerical-ode.worked-example.assured
concept_id: numerical-ode
atom_type: worked_example
bloom_level: 3
difficulty: 0.2
exam_ids: ["*"]
scaffold_fade: true
variant_of: numerical-ode.worked-example
for_stance: assured
---

## State the scaling, then the numbers

$$y_1=0.8,\quad y_2=0.64,\quad y_{\text{exact}}(0.2)=e^{-0.4}\approx0.6703,\quad E_a\approx0.0303\ (4.52\%)$$

Euler is first-order globally, so halving $h$ to $0.05$ should roughly halve this error, not quarter it — the fast check that separates "the arithmetic is right" from "the method is somehow more accurate than its own order allows." A stiffer or larger step relative to the decay constant $-2$ would risk not just slower convergence but outright oscillatory instability, a separate failure mode from truncation error.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Euler's method for exponential decay","steps":[{"prompt":"At t=0, y=1. What is the slope f(0,1) = -2(1)?","hint":"The slope tells us how fast y is changing at this point.","answer":"f(0,1) = -2"},{"prompt":"Take one Euler step. Compute y1 = y0 + h·f(t0,y0) = 1 + 0.1×(-2).","hint":"Multiply the step size h=0.1 by the slope, then add to the current value.","answer":"y1 = 0.8"},{"prompt":"At t1=0.1, the new slope is f(0.1, 0.8) = -2(0.8). What is it?","hint":"The slope changes because y has changed.","answer":"f(0.1, 0.8) = -1.6"},{"prompt":"Take the second Euler step. Compute y2 = 0.8 + 0.1×(-1.6).","hint":"Apply the same formula with the new slope.","answer":"y2 = 0.64"},{"prompt":"Solve the ODE exactly: y(t) = e^{-2t}. What is y(0.2)?","hint":"Evaluate the exponential: e^{-0.4}.","answer":"y(0.2) = e^{-0.4} ≈ 0.6703"},{"prompt":"The numerical solution was 0.64, exact is 0.6703. What is the error?","hint":"Error = |exact - numerical|. Express as a percentage.","answer":"Error ≈ 0.0303 or 4.52%"}],"caption":"Euler's method is intuitive but accumulates error. RK4 evaluates the slope at intermediate points, reducing per-step error dramatically."}
```
