# Numerical ODE Solvers

> GATE Engineering Mathematics | Numerical Methods | medium frequency | difficulty: 0.6

## Intuition First

When you can't solve a differential equation analytically, you simulate the solution by taking tiny steps forward. You start at a known point, estimate the slope (using the ODE), take a small step in that direction, and repeat. More steps = more accuracy, but slower. It's like dead reckoning in navigation: you know your current position and heading, so you extrapolate where you'll be next.

## Core Definition

**Runge-Kutta 4th Order (RK4) Method**: For the initial-value problem $\frac{dy}{dt} = f(t, y)$ with $y(t_0) = y_0$, the RK4 method advances the solution by:

$$y_{n+1} = y_n + \frac{h}{6}(k_1 + 2k_2 + 2k_3 + k_4)$$

where
$$k_1 = f(t_n, y_n)$$
$$k_2 = f\left(t_n + \frac{h}{2}, y_n + \frac{h}{2}k_1\right)$$
$$k_3 = f\left(t_n + \frac{h}{2}, y_n + \frac{h}{2}k_2\right)$$
$$k_4 = f(t_n + h, y_n + hk_3)$$

The step size is $h = \Delta t$. RK4 is a **4th-order method**: local truncation error is $O(h^5)$ and global error is $O(h^4)$. The four evaluations $k_1, k_2, k_3, k_4$ represent slopes at different points within the interval, weighted carefully to approximate the integral of $f$.

## What Happens (Worked Example)

**Problem**: Solve $\frac{dy}{dt} = -2y$ with $y(0) = 1$ using RK4 with step size $h = 0.1$ to find $y(0.1)$.

**Computation**:
- $t_0 = 0$, $y_0 = 1$, $f(t, y) = -2y$
- $k_1 = f(0, 1) = -2(1) = -2$
- $k_2 = f(0.05, 1 + 0.05(-2)) = f(0.05, 0.9) = -2(0.9) = -1.8$
- $k_3 = f(0.05, 1 + 0.05(-1.8)) = f(0.05, 0.91) = -2(0.91) = -1.82$
- $k_4 = f(0.1, 1 + 0.1(-1.82)) = f(0.1, 0.818) = -2(0.818) = -1.636$
- $y_1 = 1 + \frac{0.1}{6}(-2 + 2(-1.8) + 2(-1.82) + (-1.636)) = 1 + \frac{0.1}{6}(-10.616) \approx 1 - 0.1769 = 0.8231$

**Exact solution**: $y(t) = e^{-2t}$, so $y(0.1) = e^{-0.2} \approx 0.8187$. **RK4 error ≈ 0.0044** (very accurate!)

**Why it works**: The weighted average of slopes $k_1, k_2, k_3, k_4$ approximates the true integral $\int_{t_n}^{t_n+h} \frac{dy}{dt}\,dt$. Geometrically: you evaluate the slope at the start (pessimistic), midpoint (twice—correcting for curvature), and end (optimistic), then blend them to get a highly accurate slope estimate over the whole interval.

## GATE MA Relevance

> **Why it matters in GATE MA:** Numerical ODE solvers appear in 1–2% of GATE papers as harder (2–3 mark) questions. Topics tested: (1) "Compute $y_1$ using Euler or RK2/RK4 given $y'=f(t, y)$ and $y(0) = y_0$"; (2) "Compare local truncation error of Euler vs. RK2 vs. RK4"; (3) "Find step size $h$ to achieve error bound $< \epsilon$." The computational questions reward careful arithmetic. Medium-frequency, medium-difficulty topic.
