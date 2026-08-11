# Teaching Tips: Integration by Substitution

## Common Student Errors

- **Forgetting to transform $dx$:** Students substitute $u$ but forget to change $dx$ to $du/f'(x)$.
- **Wrong u-choice:** Choosing the outer function instead of the inner function.
- **Not substituting back:** Solving for $u$ but forgetting to rewrite the answer in terms of $x$.

## GATE Question Pattern

GATE asks: evaluate $\int f(g(x)) g'(x) dx$ by substitution (MCQ or NAT). Typical: $\int x e^{x^2} dx$, $\int 2x/(x^2+1) dx$. Often 1–2 marks. Test if students recognize when substitution applies.

## Speed Tricks for MCQs

- **Spot the chain:** If the integrand looks like $f'(g(x)) \cdot g(x)'$, substitution works.
- **Pick u = inner:** The inner function in the composition is usually the right choice for $u$.
- **Transform everything:** Once $u$ is chosen, rewrite the entire integral including $dx$.

## Must-Memorize Formulas / Results

- **Substitution rule:** $\int f(g(x)) g'(x) dx = \int f(u) du$ where $u = g(x)$.
- **Common patterns:** $\int e^{ax} dx = \frac{1}{a}e^{ax} + C$, $\int \frac{1}{ax+b} dx = \frac{1}{a}\ln|ax+b| + C$, $\int \sin(ax) dx = -\frac{1}{a}\cos(ax) + C$.
