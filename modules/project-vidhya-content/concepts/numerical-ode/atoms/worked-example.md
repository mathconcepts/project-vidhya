---
id: numerical-ode.worked-example
concept_id: numerical-ode
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
---

## Problem: Euler's Method vs. Exact Solution

**GATE-style Problem:** 

Solve the initial value problem 
$$\frac{dy}{dt} = -2y, \quad y(0) = 1$$
using Euler's method with step size $h = 0.1$ for $t \in [0, 0.2]$.

(a) Compute the approximate solution $y_2$ at $t = 0.2$.

(b) Find the exact solution and evaluate it at $t = 0.2$.

(c) Calculate the absolute error.

---

## Solution

### Part (a): Euler's Method

Euler's method: $y_{n+1} = y_n + h \cdot f(t_n, y_n)$

Here, $f(t, y) = -2y$, $h = 0.1$, $y_0 = 1$ at $t_0 = 0$.

**Step 1** ($n=0$, $t_0 = 0$):
$$y_1 = y_0 + h \cdot f(t_0, y_0) = 1 + 0.1 \times (-2)(1) = 1 - 0.2 = 0.8$$

**Step 2** ($n=1$, $t_1 = 0.1$):
$$y_2 = y_1 + h \cdot f(t_1, y_1) = 0.8 + 0.1 \times (-2)(0.8) = 0.8 - 0.16 = 0.64$$

**Approximate solution at $t = 0.2$:** $\boxed{y_2 = 0.64}$

### Part (b): Exact Solution

The ODE $\frac{dy}{dt} = -2y$ is separable:
$$\frac{dy}{y} = -2 \, dt$$

Integrate both sides:
$$\ln|y| = -2t + C$$

$$y(t) = A e^{-2t}$$

Using initial condition $y(0) = 1$:
$$1 = A e^0 = A \implies A = 1$$

**Exact solution:** $y(t) = e^{-2t}$

At $t = 0.2$:
$$y(0.2) = e^{-0.4} \approx \boxed{0.6703}$$

### Part (c): Error Analysis

**Absolute error:**
$$E_a = |y_{\text{exact}} - y_{\text{Euler}}| = |0.6703 - 0.64| \approx 0.0303$$

**Percentage error:**
$$E_p = \frac{0.0303}{0.6703} \times 100\% \approx 4.52\%$$

**Key insight:** Euler's method is first-order, meaning the global error is $O(h)$. To halve the error, you must halve the step size (and double the computation). Higher-order methods like Runge-Kutta achieve $O(h^4)$ accuracy by evaluating the slope at intermediate points, not just endpoints.

---

## Interactive Walkthrough

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Euler's method for exponential decay","steps":[{"prompt":"Step 1: At $t=0, y=1$, what is the slope $f(0, 1) = -2(1)$?","hint":"The slope tells us how fast $y$ is changing at this point.","answer":"$f(0,1) = -2$"},{"prompt":"Step 2: Take one Euler step. Compute $y_1 = y_0 + h \\cdot f(t_0, y_0) = 1 + 0.1 \\times (-2)$.","hint":"Multiply the step size $h=0.1$ by the slope, then add to the current value.","answer":"$y_1 = 0.8$"},{"prompt":"Step 3: At $t_1 = 0.1$, the new slope is $f(0.1, 0.8) = -2(0.8)$. What is it?","hint":"The slope changes because $y$ has changed.","answer":"$f(0.1, 0.8) = -1.6$"},{"prompt":"Step 4: Take the second Euler step. Compute $y_2 = 0.8 + 0.1 \\times (-1.6)$.","hint":"Apply the same formula with the new slope.","answer":"$y_2 = 0.64$"},{"prompt":"Step 5: Solve the ODE exactly. The solution is $y(t) = e^{-2t}$. What is $y(0.2)$?","hint":"Evaluate the exponential: $e^{-0.4}$.","answer":"$y(0.2) = e^{-0.4} \\approx 0.6703$"},{"prompt":"Step 6: The numerical solution was $0.64$, exact is $0.6703$. What is the error?","hint":"Error = |exact - numerical|. Express as a percentage.","answer":"Error $\\approx 0.0303$ or 4.52%"}],"caption":"Euler's method is intuitive but accumulates error. Runge-Kutta methods reduce per-step error by evaluating the slope at intermediate points."}
```
