# Teaching Tips: Improper Integrals

## Common Student Errors

- **Forgetting the limit:** Students compute $\int_1^t 1/x^2 dx = -1/t$ but forget to take $\lim_{t \to \infty}$.
- **Wrong split:** For discontinuities at interior points, students don't split correctly.
- **p-integral rule:** Students forget $\int_1^{\infty} 1/x^p$ converges iff $p > 1$.

## GATE Question Pattern

GATE asks: (1) does this improper integral converge (MCQ)? (2) evaluate it (NAT, 2 marks). Typical: $\int_1^{\infty} 1/x^p dx$, $\int_1^{\infty} e^{-x} dx$, discontinuity at boundary.

## Speed Tricks for MCQs

- **p-integral rule:** Always check $p > 1$ for convergence of $\int_1^{\infty} 1/x^p dx$.
- **Exponential decay:** $\int_a^{\infty} e^{-x} dx$ always converges.
- **Discontinuity:** If $f(a)$ or $f(b)$ is infinite, split the integral there.

## Must-Memorize Formulas / Results

- **Type 1 (infinite limit):** $\int_a^{\infty} f(x) dx = \lim_{t \to \infty} \int_a^t f(x) dx$
- **Type 2 (discontinuity):** $\int_a^b f(x) dx = \lim_{\epsilon \to 0^+} \int_a^{b-\epsilon} f(x) dx$ (if discontinuous at $b$)
- **p-integral:** $\int_1^{\infty} \frac{1}{x^p} dx$ converges iff $p > 1$.
- **Gaussian integral:** $\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}$ (advanced, rarely on GATE).
