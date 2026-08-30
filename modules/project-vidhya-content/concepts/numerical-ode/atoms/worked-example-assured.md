---
# Alternative body for numerical-ode.worked-example, served when the learner stance is
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
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
variant_of: numerical-ode.worked-example
for_stance: assured
---

## Confirm stability, then read off the numbers

Euler is $O(h)$ globally; for $y'=\lambda y$ it's also only stable when $h<2/|\lambda|$. Here $\lambda=-2$, so $h<1$ is required, and $h=0.1$ clears that comfortably, so amplification is not a concern in this problem.

$$y_2=0.64,\qquad y(0.2)=e^{-0.4}\approx0.6703,\qquad E_a\approx0.0303,\ E_p\approx4.52\%$$

Halving $h$ to $0.05$ would roughly halve $E_a$ too, since the global error here is first order — the accuracy-for-cost trade Runge-Kutta exists specifically to improve on.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Euler's method for exponential decay","steps":[{"prompt":"Step 1: At $t=0, y=1$, what is the slope $f(0, 1) = -2(1)$?","hint":"The slope tells us how fast $y$ is changing at this point.","answer":"$f(0,1) = -2$"},{"prompt":"Step 2: Take one Euler step. Compute $y_1 = y_0 + h \\cdot f(t_0, y_0) = 1 + 0.1 \\times (-2)$.","hint":"Multiply the step size $h=0.1$ by the slope, then add to the current value.","answer":"$y_1 = 0.8$"},{"prompt":"Step 3: At $t_1 = 0.1$, the new slope is $f(0.1, 0.8) = -2(0.8)$. What is it?","hint":"The slope changes because $y$ has changed.","answer":"$f(0.1, 0.8) = -1.6$"},{"prompt":"Step 4: Take the second Euler step. Compute $y_2 = 0.8 + 0.1 \\times (-1.6)$.","hint":"Apply the same formula with the new slope.","answer":"$y_2 = 0.64$"},{"prompt":"Step 5: Solve the ODE exactly. The solution is $y(t) = e^{-2t}$. What is $y(0.2)$?","hint":"Evaluate the exponential: $e^{-0.4}$.","answer":"$y(0.2) = e^{-0.4} \\approx 0.6703$"},{"prompt":"Step 6: The numerical solution was $0.64$, exact is $0.6703$. What is the error?","hint":"Error = |exact - numerical|. Express as a percentage.","answer":"Error $\\approx 0.0303$ or 4.52%"}],"caption":"Euler's method is intuitive but accumulates error. Runge-Kutta methods reduce per-step error by evaluating the slope at intermediate points."}
```

