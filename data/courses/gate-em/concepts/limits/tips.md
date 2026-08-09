# Teaching Tips: Limits

## Common Student Errors

- **Forgetting $\sin(x)/x = 1$:** Students try to compute $\lim_{x \to 0} \sin(x)/x$ by direct substitution and get confused. This MUST be memorized.
- **Misapplying L'Hôpital too early:** Students use L'Hôpital on $0/1$ or $2/3$ (where it's not indeterminate), getting wrong answers. Only use it on $0/0$, $\infty/\infty$, etc.
- **Not factoring before canceling:** Students forget to factor $(x^3 - 8)$ and get stuck. Always check for common factors in indeterminate forms.

## GATE Question Pattern

GATE typically asks: (1) Compute $\lim_{x \to a} f(x)$ for rational or trigonometric functions (MCQ or NAT). (2) Distinguish one-sided limits (rare, 2-mark MCQ). (3) Indeterminate forms require factoring, rationalization, or L'Hôpital. Trap: the limit can exist even if $f(a)$ is undefined.

## Speed Tricks for MCQs

- **Degree rule for rationals:** If numerator and denominator are polynomials, compare degrees. If equal, limit = ratio of leading coefficients. If numerator's degree is higher, limit = $\infty$. If lower, limit = $0$.
- **Standard limits toolkit:** Memorize $\sin(x)/x \to 1$, $(1 + 1/x)^x \to e$, $\ln(1+x)/x \to 1$. They appear constantly.
- **Substitution trick:** For $\lim_{x \to 0} f(1/x) \cdot g(x)$ (like $x\sin(1/x)$), substitute $u = 1/x$ to convert to a standard form.

## Must-Memorize Formulas / Results

- **Definition:** $\lim_{x \to a} f(x) = L$ iff $\forall \epsilon > 0, \exists \delta > 0$ such that $|f(x) - L| < \epsilon$ when $0 < |x - a| < \delta$.
- **Standard limits:** $\lim_{x \to 0} \frac{\sin(x)}{x} = 1$, $\lim_{x \to 0} \frac{\tan(x)}{x} = 1$, $\lim_{x \to 0} \frac{\ln(1+x)}{x} = 1$, $\lim_{x \to \infty} (1 + 1/x)^x = e$.
- **L'Hôpital's rule:** If $\lim_{x \to a} f(x)/g(x)$ is $0/0$ or $\infty/\infty$, then $\lim_{x \to a} \frac{f(x)}{g(x)} = \lim_{x \to a} \frac{f'(x)}{g'(x)}$.
- **Squeeze Theorem:** If $h(x) \leq f(x) \leq g(x)$ and $\lim h(x) = \lim g(x) = L$, then $\lim f(x) = L$.
