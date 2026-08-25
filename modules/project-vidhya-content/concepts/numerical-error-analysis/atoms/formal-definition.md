---
id: numerical-error-analysis.formal-definition
concept_id: numerical-error-analysis
atom_type: formal_definition
bloom_level: 2
difficulty: 0.20
exam_ids: ["*"]
---

**Absolute error**: $E_a = |x_t - x_a|$, where $x_t$ is the true value and $x_a$ is the approximate value.

**Relative error**: $E_r = \dfrac{|x_t - x_a|}{|x_t|}$, defined when $x_t \neq 0$.

**Percentage error**: $E_p = E_r \times 100\%$.

**Significant digits**: digits in a number that carry genuine precision.
- All nonzero digits are significant.
- Zeros *between* nonzero digits are significant (e.g., $205$ has 3 significant digits).
- Leading zeros (before the first nonzero digit) are **not** significant (e.g., $0.0034$ has 2 significant digits).
- Trailing zeros **after a decimal point** are significant (e.g., $3.4500$ has 5 significant digits).
- Trailing zeros in a whole number with no decimal point (e.g., $1200$) are ambiguous without extra context (scientific notation removes the ambiguity: $1.2\times10^3$ vs. $1.200\times10^3$).

**Rounding error**: the error introduced by representing a value using a finite number of digits, obtained by rounding to the nearest representable value. This is a *representation* error.

**Truncation error**: the error introduced by terminating an infinite or iterative process after finitely many steps — e.g., stopping a Taylor series expansion after $n$ terms, or stopping an iterative numerical method after $n$ iterations. This is an *algorithmic/mathematical* approximation error, distinct from how finely a single number is represented.

**Error propagation through arithmetic** (given quantities $x, y$ with absolute errors $\delta x, \delta y$):
- **Addition/subtraction**: $E_a(x \pm y) \leq \delta x + \delta y$ — absolute errors add in the worst case, even for subtraction.
- **Multiplication**: $E_r(xy) \approx E_r(x) + E_r(y)$ — relative errors approximately add; equivalently, the absolute error is $E_a(xy) \approx |y|\,\delta x + |x|\,\delta y$.
- **Division**: $E_r\!\left(\dfrac{x}{y}\right) \approx E_r(x) + E_r(y)$ — relative errors still add, even though the operation is division.
