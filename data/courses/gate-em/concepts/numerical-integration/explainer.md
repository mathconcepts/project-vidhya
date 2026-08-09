# Numerical Integration

> GATE Engineering Mathematics | Numerical Methods | high frequency | difficulty: 0.4

## Intuition First

You need to find the area under a curve, but the function is too ugly to integrate by hand. Numerical integration approximates the area by dividing it into strips and summing their areas. Trapezoid rule uses slanted-roof shapes (fast but rough); Simpson's rule uses curved-roof shapes (slower but far more accurate).

## Core Definition

**Simpson's 1/3 Rule**: For a function $f(x)$ on an interval $[a, b]$ divided into an even number of equal subintervals, the integral is approximated by:

$$\int_a^b f(x)\,dx \approx \frac{h}{3} \left[ f(x_0) + 4f(x_1) + 2f(x_2) + 4f(x_3) + \cdots + 2f(x_{n-2}) + 4f(x_{n-1}) + f(x_n) \right]$$

where $h = \frac{b-a}{n}$ (subinterval width) and $n$ is even. The formula interpolates the function over each pair of subintervals using a **parabola** (quadratic polynomial). The "1/3" factor comes from $\int_0^{2h} P_2(x)\,dx = \frac{h}{3}[y_0 + 4y_1 + y_2]$ where $P_2$ is the Lagrange interpolant through three points.

## What Happens (Worked Example)

**Problem**: Approximate $\int_0^1 e^x\,dx$ using Simpson's 1/3 rule with $n=2$ subintervals.

**Computation**:
- $h = \frac{1 - 0}{2} = 0.5$
- Nodes: $x_0 = 0$, $x_1 = 0.5$, $x_2 = 1$
- Function values: $f(0) = 1$, $f(0.5) = e^{0.5} \approx 1.649$, $f(1) = e \approx 2.718$
- Simpson's formula: $I \approx \frac{0.5}{3}[1 + 4(1.649) + 2.718] = \frac{0.5}{3}[1 + 6.596 + 2.718] = \frac{0.5}{3}(10.314) \approx 1.719$

**Exact answer**: $\int_0^1 e^x\,dx = e - 1 \approx 1.718$. **Error = 0.001** (incredibly accurate with just 3 points!)

**Why it works**: Each pair of subintervals is interpolated by a parabola (degree-2 polynomial). A parabola passes through three points with freedom to curve up or down, so it matches the actual function shape much better than a straight line (trapezoid). Geometrically, you're approximating the curve's curvature locally—not just its slope. The weights $[1, 4, 2, 4, \ldots, 1]$ emerge from integrating the Lagrange basis polynomials.

## GATE MA Relevance

> **Why it matters in GATE MA:** Numerical integration is one of the highest-frequency topics in GATE (3–4% of papers, 2–3 questions). Question types: (1) "Approximate $\int_a^b f(x)\,dx$ using trapezoidal or Simpson's rule"; (2) "Compare error in Simpson vs. trapezoidal"; (3) "Find the number of subintervals needed to achieve error $< \epsilon$." The composite/repeated Simpson's rule is tested more than single-interval Simpson's.
