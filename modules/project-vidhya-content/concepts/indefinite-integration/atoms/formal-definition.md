---
id: indefinite-integration.formal_definition
concept_id: indefinite-integration
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

**Indefinite integral**: $\int f(x)\,dx = F(x)+C$, where $F'(x)=f(x)$ for every $x$ in the interval considered, and $C$ is an arbitrary constant. $F$ is called an antiderivative of $f$; any two antiderivatives of the same $f$ differ only by a constant.

**Linearity**: $\int [af(x)+bg(x)]\,dx = a\int f(x)\,dx + b\int g(x)\,dx$ for constants $a,b$.

**Substitution rule**: if $u=g(x)$ is differentiable, $\int f(g(x))\,g'(x)\,dx = \int f(u)\,du$. It applies whenever the integrand contains a function alongside a constant multiple of that function's own derivative.

**Integration by parts**: $\int u\,dv = uv - \int v\,du$, derived from the product rule $(uv)'=u'v+uv'$ run backwards. Choosing which factor is $u$ follows LIATE — Logarithmic, Inverse trigonometric, Algebraic, Trigonometric, Exponential — with the earlier type in that list taken as $u$.

**Partial fraction decomposition**: for a proper rational function $\dfrac{P(x)}{Q(x)}$ (degree of $P$ less than degree of $Q$) with $Q(x)$ factored into linear and irreducible quadratic factors, the fraction splits into a sum of simpler terms — $\dfrac{A}{(x-a)^k}$ per repeated linear factor (one term for every power from $1$ to $k$), and $\dfrac{Ax+B}{(x^2+bx+c)^k}$ per repeated irreducible quadratic factor. An improper rational function ($\deg P \geq \deg Q$) must be reduced by polynomial division first.

**Method selector**: check substitution before anything else — look for the integrand containing a function together with (a constant multiple of) its own derivative. If the integrand is a product of structurally unlike functions with no such pair, use by parts. Reach for partial fractions only once both of those have been ruled out on a genuine rational function.
