# Teaching Tips: Partial Fractions

## Common Student Errors

- **Forgetting repeated factors:** Students decompose $(x-1)^2$ as single $\frac{A}{x-1}$ instead of $\frac{A}{x-1} + \frac{B}{(x-1)^2}$.
- **Wrong cover-up formula:** Students forget to multiply both sides by the factor before substituting.
- **Quadratic factors:** Students forget to use $\frac{Ax+B}{x^2 + px + q}$ for irreducible quadratics.

## GATE Question Pattern

GATE asks: (1) decompose a rational function (MCQ), (2) integrate using decomposition (NAT, 2 marks). Typical: $\frac{P(x)}{(x-a)(x-b)}$ or $\frac{P(x)}{(x-a)^2}$. Rarely involve irreducible quadratics.

## Speed Tricks for MCQs

- **Cover-up method:** For $\frac{P(x)}{(x-a)(x-b)}$, cover the factor $(x-a)$ and substitute $x = a$ into the remaining expression to get the numerator of $\frac{A}{x-a}$.
- **Repeated factors:** For $(x-a)^n$, you need $n$ terms: $\frac{A_1}{x-a} + \frac{A_2}{(x-a)^2} + \cdots$.
- **Always integrate:** Once decomposed, each term is easy to integrate.

## Must-Memorize Formulas / Results

- **Distinct linear factors:** $\\frac{P(x)}{(x-a)(x-b)} = \\frac{A}{x-a} + \\frac{B}{x-b}$
- **Repeated linear factors:** $\\frac{P(x)}{(x-a)^n} = \\frac{A_1}{x-a} + \\frac{A_2}{(x-a)^2} + \\cdots + \\frac{A_n}{(x-a)^n}$
- **Irreducible quadratic:** $\\frac{P(x)}{x^2 + px + q} = \\frac{Ax + B}{x^2 + px + q}$ (when discriminant < 0)
