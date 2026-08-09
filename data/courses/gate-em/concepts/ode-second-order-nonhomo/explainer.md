# Second Order Non-Homogeneous ODEs
> GATE Engineering Mathematics | Differential Equations | high frequency | difficulty: 0.6

## Intuition First
Imagine a driven spring: without an external force, it oscillates naturally (homogeneous equation). But when you apply a time-varying push (the "forcing" term), the solution splits into a natural response plus a forced response. The non-homogeneous term captures that external push.

## Core Definition
**Standard Second-Order Non-Homogeneous Linear ODE** (constant coefficients):
$$a\frac{d^2y}{dx^2} + b\frac{dy}{dx} + cy = f(x)$$
where $f(x) \neq 0$ is the non-homogeneous term.

**General Solution Structure**:
$$y(x) = y_h(x) + y_p(x)$$
where:
- $y_h(x)$ is the **homogeneous solution** (solves $a\frac{d^2y}{dx^2} + b\frac{dy}{dx} + cy = 0$)
- $y_p(x)$ is a **particular solution** (any solution to the full non-homogeneous equation)

**Particular Solution Methods**:
1. **Method of Undetermined Coefficients**: Guess a form for $y_p$ based on $f(x)$, then solve for the coefficients.
2. **Variation of Parameters**: Use the homogeneous solutions $y_1, y_2$ to construct $y_p$ via integration.

## What Happens (Worked Example)
Label: "**What happens:**"

Consider $\frac{d^2y}{dx^2} - 3\frac{dy}{dx} + 2y = e^x$ with $y(0) = 0$ and $y'(0) = 0$.

**Step 1:** Solve the homogeneous equation $\frac{d^2y}{dx^2} - 3\frac{dy}{dx} + 2y = 0$.
Characteristic equation: $r^2 - 3r + 2 = 0 \Rightarrow (r - 1)(r - 2) = 0 \Rightarrow r_1 = 1, r_2 = 2$.
$$y_h(x) = C_1 e^x + C_2 e^{2x}$$

**Step 2:** Find a particular solution for $\frac{d^2y}{dx^2} - 3\frac{dy}{dx} + 2y = e^x$.
Since the homogeneous solution already contains $e^x$ (from $r_1 = 1$), we use **resonance form**: try $y_p = Axe^x$.

**Step 3:** Compute derivatives:
$$y_p' = Ae^x + Axe^x = A(1 + x)e^x$$
$$y_p'' = Ae^x + A(1 + x)e^x = A(2 + x)e^x$$

**Step 4:** Substitute into the non-homogeneous equation:
$$A(2 + x)e^x - 3A(1 + x)e^x + 2Axe^x = e^x$$
$$Ae^x[(2 + x) - 3(1 + x) + 2x] = e^x$$
$$Ae^x[2 + x - 3 - 3x + 2x] = e^x$$
$$Ae^x[-1] = e^x$$
$$A = -1$$

So $y_p(x) = -xe^x$.

**Step 5:** Write the general solution:
$$y(x) = y_h(x) + y_p(x) = C_1 e^x + C_2 e^{2x} - xe^x$$

**Step 6:** Apply initial conditions. $y(0) = 0$:
$$0 = C_1 + C_2$$
$$C_2 = -C_1$$

**Step 7:** Differentiate:
$$y'(x) = C_1 e^x + 2C_2 e^{2x} - e^x - xe^x$$

Apply $y'(0) = 0$:
$$0 = C_1 + 2C_2 - 1$$
$$C_1 + 2C_2 = 1$$

**Step 8:** Solve the system:
$$C_2 = -C_1$$
$$C_1 - 2C_1 = 1$$
$$-C_1 = 1 \Rightarrow C_1 = -1, C_2 = 1$$

**Final Particular Solution**:
$$y(x) = -e^x + e^{2x} - xe^x = e^{2x} - (1 + x)e^x$$

This is a superposition: the $e^{2x}$ mode grows exponentially (natural response), the $(1 + x)e^x$ term represents the forced response at resonance frequency, and the linear multiplier $x$ in the resonance term shows that the forcing is perfectly aligned with a natural frequency.

Label: "**Why it works:**"
The key insight is that any linear combination of homogeneous solutions is again a homogeneous solution. So, to describe the full solution space of the non-homogeneous equation, we add one particular solution to the homogeneous family. The particular solution represents the "forced" part of the motion, while the homogeneous part decays (or persists, depending on the roots) over time. When the forcing frequency matches a homogeneous frequency (resonance), the particular solution gains a polynomial factor (here, $x$) to remain bounded.

## GATE MA Relevance
> **Why it matters in GATE MA:** Second-order non-homogeneous ODEs account for ~12-15% of GATE MA questions (8-12 marks). Questions typically ask you to: (1) solve the full non-homogeneous problem with given initial conditions, (2) recognize when resonance occurs and apply the resonance form, or (3) write the structure of the general solution without computing constants. Problems often involve exponential, polynomial, or sinusoidal forcing terms—and the Method of Undetermined Coefficients is the expected technique (not variation of parameters, which is slower under exam time pressure).
