# Teaching Tips: Numerical ODE Solvers

## Common Student Errors

- **Order confusion**: Students mix up local truncation error (LTE) with global truncation error (GTE). LTE is what happens in one step; GTE is the cumulative error. For Euler, LTE is $O(h^2)$ but GTE is $O(h)$ because there are many steps. A question asking "which method is 2nd order?" expects the answer to refer to GTE order, which is 2 for Heun/RK2 but only 1 for Euler.
- **RK4 coefficient arithmetic**: The weights in RK4 are $\frac{1}{6}(k_1 + 2k_2 + 2k_3 + k_4)$. Students often write $\frac{1}{6}(k_1 + k_2 + k_3 + k_4)$ (equal weights), which is wrong. The 2-2-1 pattern is critical.
- **Forgetting to advance $t$**: Some students compute $k_2, k_3, k_4$ at the same time $t_n$ as $k_1$, forgetting that each $k$ is evaluated at a different time. For RK4, $k_2$ and $k_3$ are at $t_n + h/2$, while $k_4$ is at $t_n + h$. Forgetting this completely changes the answer.

## GATE Question Pattern

Numerical ODE questions in GATE split into two: (1) **Computational**: "Given ODE and initial condition, compute $y(t_1)$ using Euler/RK2/RK4 with step $h$." These require careful step-by-step arithmetic but are conceptually straightforward. (2) **Theoretical**: "Compare LTE of Euler vs. Heun," or "What step size ensures error $< \epsilon$?" These require understanding the error formulas and how accuracy scales with $h$. Questions rarely ask for RK4 by name (arithmetic is tedious), but often ask "which method is 4th order?" to see if you know RK4 is the canonical choice.

## Speed Tricks for MCQs

- **Euler as a baseline**: Euler is so simple ($y_1 = y_0 + h f(t_0, y_0)$) that if the question gives $h$, $t_0$, $y_0$, and $f$, you can instantly compute the answer. Use it to rule out options and then verify with a more accurate method if the question asks.
- **Skip RK4 arithmetic**: If a multiple-choice question offers Euler and RK4 both as methods to apply, and says "approximate $y(0.1)$ with step 0.01," pick Euler. The RK4 computation will take 3–4 times longer, and in GATE time is limited. After computing Euler's answer, note that RK4 will be more accurate (closer to the true value), ruling out some options.
- **Error halving intuition**: If you halve the step size, Euler error drops by 1/2, Heun by 1/4, RK4 by 1/16. Use this to estimate: "If Euler at $h=0.1$ has error 0.01, then at $h=0.05$ error is ~0.005." No detailed calculation needed.

## Must-Memorize Formulas / Results

- **Euler's method**: $y_{n+1} = y_n + h f(t_n, y_n)$ (1st order, $O(h)$)
- **Heun's method (RK2)**: $y_{n+1} = y_n + \\frac{h}{2}(k_1 + k_2)$ where $k_1 = f(t_n, y_n)$, $k_2 = f(t_n + h, y_n + h k_1)$ (2nd order, $O(h^2)$)
- **RK4**: $y_{n+1} = y_n + \\frac{h}{6}(k_1 + 2k_2 + 2k_3 + k_4)$ where
  - $k_1 = f(t_n, y_n)$
  - $k_2 = f(t_n + h/2, y_n + hk_1/2)$
  - $k_3 = f(t_n + h/2, y_n + hk_2/2)$
  - $k_4 = f(t_n + h, y_n + hk_3)$
  
  (4th order, $O(h^4)$)
- **Local truncation error (LTE)**: Euler $O(h^2)$, Heun $O(h^3)$, RK4 $O(h^5)$
- **Global truncation error (GTE)**: Euler $O(h)$, Heun $O(h^2)$, RK4 $O(h^4)$
- **Stability condition for Euler** on $dy/dt = \\lambda y$: $|1 + h\\lambda| < 1$ or $h < \\frac{2}{|\\lambda|}$ (for $\\lambda < 0$)
