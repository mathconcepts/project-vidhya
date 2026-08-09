# Teaching Tips: Definite Integrals

## Common Student Errors

- **Forgetting $F(b) - F(a)$:** Students compute $F(x)$ but forget to evaluate at both limits.
- **Wrong order:** Students compute $F(a) - F(b)$ instead of $F(b) - F(a)$.
- **Absolute value confusion:** For areas, use $\int |f(x)| dx$, not $\int f(x) dx$ when $f$ crosses the x-axis.

## GATE Question Pattern

GATE asks: evaluate $\int_a^b f(x) dx$ (MCQ or NAT). Typical: polynomials, exponentials, trig, logarithms. Often 1–2 marks. Sometimes ask for area between curves.

## Speed Tricks for MCQs

- **Odd/even trick:** Odd functions integrate to 0 over $[-a, a]$. Even functions double: $\int_{-a}^a f(x) dx = 2 \int_0^a f(x) dx$.
- **FTC shorthand:** Just find the antiderivative and evaluate at the limits.
- **Common values:** Memorize $\int_0^1 e^x dx = e - 1$, $\int_0^{\pi/2} \sin(x) dx = 1$.

## Must-Memorize Formulas / Results

- **Fundamental Theorem of Calculus:** $\int_a^b f(x) dx = F(b) - F(a)$ where $F' = f$.
- **Odd function:** $\int_{-a}^a f(x) dx = 0$ if $f(-x) = -f(x)$.
- **Even function:** $\int_{-a}^a f(x) dx = 2\int_0^a f(x) dx$ if $f(-x) = f(x)$.
