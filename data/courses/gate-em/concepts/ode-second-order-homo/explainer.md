# Second Order Homogeneous ODEs
> GATE Engineering Mathematics | Differential Equations | high frequency | difficulty: 0.5

## Intuition First
A second-order homogeneous ODE governs systems with "memory" — like a damped spring that remembers both where it is and how fast it's moving. The solution is a combination of two independent modes that decay, oscillate, or grow depending on the roots of a characteristic equation.

## Core Definition
**Standard Second-Order Homogeneous Linear ODE** (constant coefficients):
$$a\frac{d^2y}{dx^2} + b\frac{dy}{dx} + cy = 0$$
where $a, b, c$ are constants and $a \neq 0$.

**Characteristic Equation**: Replace $\frac{d^2y}{dx^2}$ with $r^2$, $\frac{dy}{dx}$ with $r$, and $y$ with 1:
$$ar^2 + br + c = 0$$

**Solutions depend on the roots** $r_1, r_2$:
1. **Distinct real roots** ($r_1 \neq r_2$): $y(x) = C_1 e^{r_1 x} + C_2 e^{r_2 x}$
2. **Repeated root** ($r_1 = r_2 = r$): $y(x) = (C_1 + C_2 x) e^{rx}$
3. **Complex conjugate roots** ($r = \alpha \pm i\beta$): $y(x) = e^{\alpha x}(C_1 \cos(\beta x) + C_2 \sin(\beta x))$

## What Happens (Worked Example)
Label: "**What happens:**"

Consider $\frac{d^2y}{dx^2} - 5\frac{dy}{dx} + 6y = 0$ with $y(0) = 1$ and $y'(0) = 0$.

**Step 1:** Form the characteristic equation:
$$r^2 - 5r + 6 = 0$$

**Step 2:** Factor (or use the quadratic formula):
$$(r - 2)(r - 3) = 0$$
$$r_1 = 2, \quad r_2 = 3$$

These are distinct real roots.

**Step 3:** Write the general solution:
$$y(x) = C_1 e^{2x} + C_2 e^{3x}$$

**Step 4:** Apply initial conditions. First, $y(0) = 1$:
$$1 = C_1 e^{0} + C_2 e^{0} = C_1 + C_2$$

**Step 5:** Differentiate the general solution:
$$y'(x) = 2C_1 e^{2x} + 3C_2 e^{3x}$$

Apply $y'(0) = 0$:
$$0 = 2C_1 + 3C_2$$

**Step 6:** Solve the system:
$$C_1 + C_2 = 1$$
$$2C_1 + 3C_2 = 0$$

From the second equation: $C_1 = -\frac{3}{2}C_2$. Substitute into the first:
$$-\frac{3}{2}C_2 + C_2 = 1$$
$$-\frac{1}{2}C_2 = 1$$
$$C_2 = -2, \quad C_1 = 3$$

**Final Particular Solution:**
$$y(x) = 3e^{2x} - 2e^{3x}$$

This is a superposition of two exponential modes: the $e^{2x}$ mode (growing slower) and the $e^{3x}$ mode (growing faster). Initially they are tuned so that the derivative is zero, but over time the faster-growing mode dominates.

Label: "**Why it works:**"
The characteristic equation arises from assuming a solution of the form $y = e^{rx}$. Substituting into the ODE yields the characteristic equation in $r$. Each root gives an independent solution, and the general solution is their linear combination. The initial conditions determine the constants $C_1$ and $C_2$.

## GATE MA Relevance
> **Why it matters in GATE MA:** Second-order homogeneous ODEs account for ~12-15% of GATE MA questions (6-10 marks). Questions typically ask you to: (1) solve given a specific ODE and initial conditions, (2) classify the roots (real/complex, distinct/repeated), or (3) write the form of the solution without finding the constants. Problems often appear as 2-mark MCQs or NATs requiring full computation.
