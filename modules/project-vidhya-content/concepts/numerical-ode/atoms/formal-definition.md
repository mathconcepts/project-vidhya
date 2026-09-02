---
id: numerical-ode.formal-definition
concept_id: numerical-ode
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

**RK4.** For $y'=f(t,y)$, $y(t_0)=y_0$:

$$y_{n+1}=y_n+\frac{h}{6}(k_1+2k_2+2k_3+k_4)$$
$$k_1=f(t_n,y_n),\quad k_2=f\!\left(t_n+\tfrac{h}{2},y_n+\tfrac{h}{2}k_1\right),\quad k_3=f\!\left(t_n+\tfrac{h}{2},y_n+\tfrac{h}{2}k_2\right),\quad k_4=f(t_n+h,y_n+hk_3)$$

Global error $O(h^4)$, versus Euler's $O(h)$.

**Method Selector.** Reach for RK4 (or an implicit method) when accuracy at a workable step size matters, or the equation is stiff — not explicit Euler, which a student picks for its one-line simplicity even though it needs many more, much smaller steps to reach the same tolerance, and can become numerically unstable (oscillating, growing without bound) on a decaying equation if $h$ is too large relative to the decay rate.
