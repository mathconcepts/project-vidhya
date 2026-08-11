# Teaching Tips: Interpolation

## Common Student Errors

- **Forgetting to check node distinctness**: The Lagrange formula assumes all $x_i$ are distinct. A question might give you a table with a repeated $x$-value (a data entry error), and a careless student might proceed anyway, dividing by zero when computing $L_i$. Always verify: "Are the points distinct?"
- **Confusing divided differences with derivatives**: Students often write $f[x_0, x_1] = f'(x_0)$, which is wrong. Divided differences are slopes of *secant* lines, not tangents. The first divided difference $f[x_0, x_1]$ approximates the derivative at the *midpoint*, not at $x_0$.
- **Arithmetic mistakes in basis polynomials**: Computing Lagrange basis $L_i(x)$ requires careful fraction arithmetic. A sign flip or denominator swap will give a completely wrong answer. Always double-check: $L_i(x_i) = 1$ and $L_i(x_j) = 0$ for $j \neq i$.

## GATE Question Pattern

GATE questions on interpolation split into three patterns: (1) **Direct Lagrange computation**: "Given 3 points, compute $P(x_*)$." These are straightforward arithmetic; no tricks. (2) **Method selection**: "Which formula is best for equally-spaced points?" Answer: Newton forward/backward (faster by orders of magnitude). (3) **Error estimation**: "Bound the error in interpolating $e^x$ on $[0, 1]$ with 3 points." These require knowing the error formula $E(x) \\leq \\frac{M}{(n+1)!} \\max |\\prod (x-x_i)|$ and can be tricky.

## Speed Tricks for MCQs

- **Linear interpolation shortcut**: For 2 points, $P(x) = y_0 + (y_1 - y_0) \frac{x - x_0}{x_1 - x_0}$. This is instant. Don't write out Lagrange basis; just use the formula directly.
- **Symmetry check**: If the interpolation points are symmetric around some $x = a$, the polynomial often has a pattern. E.g., for $f(x) = x^2$ at $x = -1, 0, 1$, the interpolant is $P(x) = x^2$ (exact). Recognize symmetry to avoid detailed computation.
- **Divided differences table**: For 3–4 points, building a divided-difference table is often faster than Lagrange because you reuse intermediate results. Set up the table once, then apply Newton's formula $P(x) = f[x_0] + f[x_0,x_1](x-x_0) + f[x_0,x_1,x_2](x-x_0)(x-x_1) + \ldots$.

## Must-Memorize Formulas / Results

- **Lagrange interpolating polynomial**: $P_n(x) = \\sum_{i=0}^{n} y_i L_i(x)$ where $L_i(x) = \\prod_{j \\neq i} \\frac{x - x_j}{x_i - x_j}$
- **Lagrange basis property**: $L_i(x_j) = \\delta_{ij}$ (Kronecker delta)
- **Interpolation error**: $E(x) = |f(x) - P_n(x)| \\leq \\frac{M}{(n+1)!} |\\prod_{i=0}^{n} (x - x_i)|$ where $M = \\max |f^{(n+1)}(x)|$
- **First divided difference**: $f[x_0, x_1] = \\frac{f(x_1) - f(x_0)}{x_1 - x_0}$ (secant slope)
- **Newton's divided-difference form**: $P_n(x) = f[x_0] + f[x_0,x_1](x-x_0) + f[x_0,x_1,x_2](x-x_0)(x-x_1) + \\ldots$
- **Newton forward difference** (equally-spaced $x_i = x_0 + ih$): $P_n(x) = f_0 + (p) \\Delta f_0 + \\frac{p(p-1)}{2!} \\Delta^2 f_0 + \\ldots$ where $p = \\frac{x - x_0}{h}$
