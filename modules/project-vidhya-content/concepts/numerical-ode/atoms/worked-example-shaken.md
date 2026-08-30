---
# Alternative body for numerical-ode.worked-example, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: numerical-ode.worked-example.shaken
concept_id: numerical-ode
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
variant_of: numerical-ode.worked-example
for_stance: shaken
---

Two steps of $h=0.1$ carry $t$ from $0$ to $0.2$ — decided before the first step is taken.

$$y_1=y_0+h f(t_0,y_0)=1+0.1(-2)(1)=0.8$$

$$y_2=y_1+h f(t_1,y_1)=0.8+0.1(-2)(0.8)=0.64$$

Exact: $y(t)=e^{-2t}$, so $y(0.1)=e^{-0.2}\approx0.8187$ and $y(0.2)=e^{-0.4}\approx0.6703$.

| $n$ | $y_n$ | error $\lvert y_{\text{exact}}(t_n)-y_n\rvert$ |
|---|---|---|
| $1$ | $0.8$ | $\approx0.0187$ |
| $2$ | $0.64$ | $\approx0.0303$ |

The error grows step to step — normal for accumulating truncation — even while $y$ itself keeps shrinking each time.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Euler's method for exponential decay","steps":[{"prompt":"Step 1: At $t=0, y=1$, what is the slope $f(0, 1) = -2(1)$?","hint":"The slope tells us how fast $y$ is changing at this point.","answer":"$f(0,1) = -2$"},{"prompt":"Step 2: Take one Euler step. Compute $y_1 = y_0 + h \\cdot f(t_0, y_0) = 1 + 0.1 \\times (-2)$.","hint":"Multiply the step size $h=0.1$ by the slope, then add to the current value.","answer":"$y_1 = 0.8$"},{"prompt":"Step 3: At $t_1 = 0.1$, the new slope is $f(0.1, 0.8) = -2(0.8)$. What is it?","hint":"The slope changes because $y$ has changed.","answer":"$f(0.1, 0.8) = -1.6$"},{"prompt":"Step 4: Take the second Euler step. Compute $y_2 = 0.8 + 0.1 \\times (-1.6)$.","hint":"Apply the same formula with the new slope.","answer":"$y_2 = 0.64$"},{"prompt":"Step 5: Solve the ODE exactly. The solution is $y(t) = e^{-2t}$. What is $y(0.2)$?","hint":"Evaluate the exponential: $e^{-0.4}$.","answer":"$y(0.2) = e^{-0.4} \\approx 0.6703$"},{"prompt":"Step 6: The numerical solution was $0.64$, exact is $0.6703$. What is the error?","hint":"Error = |exact - numerical|. Express as a percentage.","answer":"Error $\\approx 0.0303$ or 4.52%"}],"caption":"Euler's method is intuitive but accumulates error. Runge-Kutta methods reduce per-step error by evaluating the slope at intermediate points."}
```

