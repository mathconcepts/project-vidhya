---
id: numerical-ode.formal-definition
concept_id: numerical-ode
atom_type: formal_definition
bloom_level: 2
difficulty: 0.48
exam_ids: ["*"]
---

**Runge-Kutta 4th Order (RK4) Method**: For the initial-value problem $\frac{dy}{dt} = f(t, y)$ with $y(t_0) = y_0$, the RK4 method advances the solution by:

$$y_{n+1} = y_n + \frac{h}{6}(k_1 + 2k_2 + 2k_3 + k_4)$$

where
$$k_1 = f(t_n, y_n)$$
$$k_2 = f\left(t_n + \frac{h}{2}, y_n + \frac{h}{2}k_1\right)$$
$$k_3 = f\left(t_n + \frac{h}{2}, y_n + \frac{h}{2}k_2\right)$$
$$k_4 = f(t_n + h, y_n + hk_3)$$

The step size is $h = \Delta t$. RK4 is a **4th-order method**: local truncation error is $O(h^5)$ and global error is $O(h^4)$. The four evaluations $k_1, k_2, k_3, k_4$ represent slopes at different points within the interval, weighted carefully to approximate the integral of $f$.
