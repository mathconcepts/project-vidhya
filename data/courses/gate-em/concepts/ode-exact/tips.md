# Teaching Tips: Exact Equations

## Common Student Errors
- **Forgetting to verify exactness first:** Students jump straight to integration without checking $\frac{\partial M}{\partial y} = \frac{\partial N}{\partial x}$. If the equation isn't exact, the method fails. Always verify first.
- **Losing the $g(y)$ term during integration:** When integrating $M$ with respect to $x$, students sometimes forget to add $g(y)$ (the "constant" of integration that may depend on $y$). This term is crucial for recovering $F(x, y)$ completely.
- **Confusing $F(x, y)$ with an explicit solution $y(x)$:** The solution to an exact equation is usually implicit: $F(x, y) = C$. Students sometimes expect to solve explicitly for $y$, which may be impossible or very complex.

## GATE Question Pattern
GATE questions on exact equations typically present an ODE in the form $M \, dx + N \, dy = 0$ and ask you to: (1) verify exactness, (2) find the potential function $F(x, y)$, or (3) write the implicit solution. Occasionally, the question provides an initial condition and asks for the particular value of $C$, or asks you to evaluate the solution at a specific point. A harder variant: given a non-exact equation, multiply by an integrating factor (usually a simple function like $y^{-1}$ or $x^{-1}$) to make it exact, then solve. This requires recognizing patterns and knowing which integrating factors to try.

## Speed Tricks for MCQs
- **Exactness shortcut:** Use a symbolic calculator or rapid mental partial derivatives. Compute $\frac{\partial M}{\partial y}$ and $\frac{\partial N}{\partial x}$ in parallel; if they match, it's exact—no need to verify further.
- **Integration recognition:** When integrating $M(x, y)$ with respect to $x$, recognize standard forms quickly (powers, exponentials, trig). Don't expand unnecessarily.
- **$g(y)$ determination:** After differentiating $F$ with respect to $y$, the $g'(y)$ term is the part of $N$ that doesn't involve $x$. Extract it immediately and integrate.

## Must-Memorize Formulas / Results
- **Exactness condition:** $\frac{\partial M}{\partial y} = \frac{\partial N}{\partial x}$
- **Potential function construction:**
  1. $F(x, y) = \int M(x, y) \, dx + g(y)$ (integrating $M$ w.r.t. $x$)
  2. $\frac{\partial F}{\partial y} = N(x, y)$ gives $g'(y)$
  3. $g(y) = \int g'(y) \, dy$
  4. Solution: $F(x, y) = C$
- **Integrating factor (for non-exact → exact):**
  - If $\frac{1}{N}\left(\frac{\partial M}{\partial y} - \frac{\partial N}{\partial x}\right)$ is a function of $x$ only, call it $R(x)$, then $\mu(x) = e^{\int R(x) \, dx}$
  - If $\frac{1}{M}\left(\frac{\partial N}{\partial x} - \frac{\partial M}{\partial y}\right)$ is a function of $y$ only, call it $S(y)$, then $\mu(y) = e^{\int S(y) \, dy}$
- **Schwarz's theorem:** If $F$ has continuous second partial derivatives, then $\frac{\partial^2 F}{\partial x \partial y} = \frac{\partial^2 F}{\partial y \partial x}$, which guarantees $\frac{\partial M}{\partial y} = \frac{\partial N}{\partial x}$ for exact equations.
