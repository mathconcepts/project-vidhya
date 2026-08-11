# Teaching Tips: Root Finding

## Common Student Errors

- **Sign error in Newton-Raphson**: Many students write $x_{n+1} = x_n + \frac{f(x_n)}{f'(x_n)}$ (plus instead of minus). The minus sign is critical: you move *toward* the root by subtracting the tangent intercept. Geometric check: if $f(x_n) > 0$, you move left; the formula must produce $x_{n+1} < x_n$.
- **Confusing convergence rates**: Bisection is linear (each iteration halves the interval), Newton-Raphson is quadratic (error squares each iteration—why it's faster). Students often memorize "Newton is faster" without understanding that quadratic vs. linear is a *huge* difference: after 10 iterations, bisection error is $10^{-3}$, but Newton-Raphson error is $10^{-1024}$.
- **Assuming $f'(x) \neq 0$ everywhere**: Newton-Raphson fails spectacularly at multiple roots (where $f'(r) = 0$). Question might ask "which method is safer?" and the answer is bisection (no derivative needed, no division-by-zero risk).

## GATE Question Pattern

GATE tests root-finding in two ways: (1) **Conceptual MCQs** asking which method converges fastest, or what the error bound is after $n$ iterations (bisection or fixed-point); (2) **Computational MCQs** giving $f(x)$, $x_0$, asking "compute $x_1$" or "after iteration 2, $x_2 \approx ?$". The computational ones are almost always Newton-Raphson (quadratic convergence makes numbers converge visibly fast). Watch for traps: a question might ask for $x_2$ but expect you to compute it step-by-step, not memorize a formula.

## Speed Tricks for MCQs

- **For Newton-Raphson**: If $x_0$ is a "nice" number (integer, simple fraction) and $f'(x_0)$ is also nice, the computation is usually fast. Write $x_1 = x_0 - \frac{f(x_0)}{f'(x_0)}$ directly; no need to expand intermediate steps.
- **For bisection error**: After $n$ iterations, error = $\frac{\text{initial interval width}}{2^n}$. Memorize: $2^3 = 8$, $2^4 = 16$, $2^5 = 32$, $2^{10} = 1024$. Question says "after 10 bisections in $[0,1]$", answer is instantly $10^{-3}$.
- **For fixed-point convergence**: Check $|g'(r)|$. If you're given $g(x) = \frac{1}{2}(x + \frac{c}{x})$ (Newton's method for $\sqrt{c}$), compute $g'(x) = \frac{1}{2}(1 - \frac{c}{x^2})$. At the root $r = \sqrt{c}$, $g'(r) = 0$ (quadratic!). No need to prove convergence; the derivative instantly tells you the order.

## Must-Memorize Formulas / Results

- **Newton-Raphson**: $x_{n+1} = x_n - \frac{f(x_n)}{f'(x_n)}$ (quadratic convergence)
- **Bisection error**: $e_n \leq \frac{b - a}{2^n}$ (linear convergence, but guaranteed)
- **Fixed-point convergence condition**: $|g'(r)| < 1$ (necessary and sufficient for local convergence)
- **Secant method** (no derivative needed): $x_{n+1} = x_n - \frac{f(x_n)(x_n - x_{n-1})}{f(x_n) - f(x_{n-1})}$ (super-linear convergence, order ≈ 1.618)
- **Newton's method for $\sqrt{c}$**: $x_{n+1} = \frac{1}{2}\left(x_n + \frac{c}{x_n}\right)$ (special case of Newton-Raphson applied to $f(x) = x^2 - c$)
