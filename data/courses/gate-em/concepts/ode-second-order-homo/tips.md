# Teaching Tips: Second Order Homogeneous ODEs

## Common Student Errors
- **Mixing up solution forms for different root cases:** Many students write $y(x) = C_1 e^{r_1 x} + C_2 e^{r_2 x}$ even for repeated or complex roots. Remember: each case has a different form. Repeated roots get a factor of $(C_1 + C_2 x)$. Complex roots become sines and cosines.
- **Sign errors in the characteristic equation:** When writing $ar^2 + br + c = 0$, students sometimes flip signs or miscopy coefficients from the original ODE. Double-check by substitution: plug $y = e^{rx}$ back into the ODE to verify the characteristic equation.
- **Forgetting to include the exponential envelope for complex roots:** For complex roots $r = \alpha \pm i\beta$, the solution is $e^{\alpha x}(\ldots)$, not just $(\ldots)$. If $\alpha = 0$, it simplifies to pure oscillation, but the factor is still there.

## GATE Question Pattern
GATE questions on second-order homogeneous ODEs typically provide a specific ODE and ask you to: (1) find the characteristic roots, (2) classify them (real/complex, distinct/repeated), (3) write the general solution form, or (4) find the particular solution using two initial conditions (usually $y(0)$ and $y'(0)$). A common trap: mixing the discriminant $b^2 - 4ac$ with the roots themselves—understand what each tells you. Questions involving damped oscillations (e.g., springs with friction) are also frequent; these naturally lead to complex roots and the corresponding sinusoidal solution.

## Speed Tricks for MCQs
- **Characteristic equation shortcut:** Replace derivatives directly: $\frac{d^2y}{dx^2} \to r^2$, $\frac{dy}{dx} \to r$, $y \to 1$. No need to explain why—just do it mechanically.
- **Root classification without solving:** Look at the discriminant $\Delta = b^2 - 4ac$. If $\Delta > 0$, roots are real and distinct. If $\Delta = 0$, roots are real and repeated. If $\Delta < 0$, roots are complex conjugates. This tells you the solution form instantly.
- **Particular solution fast-track:** Apply initial conditions only to the general solution; don't re-derive. Substitute $y(0)$ and $y'(0)$ directly into the formulas for the general solution and its derivative.

## Must-Memorize Formulas / Results
- **Characteristic equation:** $ar^2 + br + c = 0$ obtained by replacing derivatives with powers of $r$.
- **Discriminant:** $\Delta = b^2 - 4ac$ determines the nature of roots:
  - $\Delta > 0$: distinct real roots $r_1 = \frac{-b + \sqrt{\Delta}}{2a}$, $r_2 = \frac{-b - \sqrt{\Delta}}{2a}$
  - $\Delta = 0$: repeated real root $r = \frac{-b}{2a}$
  - $\Delta < 0$: complex conjugate roots $r = \frac{-b \pm i\sqrt{|\Delta|}}{2a} = \alpha \pm i\beta$
- **General solution forms:**
  1. **Distinct real roots:** $y(x) = C_1 e^{r_1 x} + C_2 e^{r_2 x}$
  2. **Repeated root $r$:** $y(x) = (C_1 + C_2 x)e^{rx}$
  3. **Complex conjugate roots $r = \alpha \pm i\beta$:** $y(x) = e^{\alpha x}(C_1 \cos(\beta x) + C_2 \sin(\beta x))$
- **Wronskian (linear independence check):** $W = y_1 y_2' - y_1' y_2 \neq 0$ for the solution pair to span the full 2D solution space.
- **Underdamped/critically damped/overdamped:** In the context of $m\ddot{x} + c\dot{x} + kx = 0$ (spring-mass-damper):
  - Overdamped ($c^2 > 4mk$): two distinct negative real roots → exponential decay
  - Critically damped ($c^2 = 4mk$): repeated negative root → decay with polynomial factor
  - Underdamped ($c^2 < 4mk$): complex conjugate roots with negative real part → oscillatory decay
