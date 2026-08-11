# Teaching Tips: Residue Calculus

## Common Student Errors
- **Forgetting the $2\pi i$ factor**: The Residue Theorem includes a factor of $2\pi i$. Students often compute the sum of residues and forget to multiply by $2\pi i$, giving an answer that's off by a factor of $2\pi i$.
- **Confusing residue formula for different pole orders**: For a simple pole at $z_0$, use $\text{Res}(f, z_0) = \lim_{z \to z_0} (z - z_0) f(z)$. For a pole of order $n > 1$, use the derivative formula. Using the simple formula on a higher-order pole gives the wrong answer.
- **Ignoring poles outside the contour**: If a pole lies outside the contour, it contributes zero to the integral. Many students mistakenly include poles from the full factorization without checking whether they're inside or outside.

## GATE Question Pattern
GATE residue questions fall into two categories: (1) Direct computation — compute residues at given poles, apply the Residue Theorem to evaluate a contour integral. (2) Advanced — identify the nature of singularities (removable/pole/essential), handle multiple poles or higher-order poles, or use residues to evaluate real integrals (e.g., $\int_0^{\infty}$ or $\int_{-\infty}^{\infty}$ by closing the contour in the upper half-plane). Always identify which poles are inside the contour before computing residues.

## Speed Tricks for MCQs
- **Use partial fractions first**: Break the integrand into simpler terms with single poles. Each term's residue is just the numerator coefficient after cancelling the pole factor.
- **For simple poles, factor and cancel**: If $f(z) = \frac{P(z)}{(z-z_1)(z-z_2) \cdots}$ where $P$ is a polynomial, the residue at $z_k$ is $\frac{P(z_k)}{\prod_{j \neq k} (z_k - z_j)}$ (just cancel the pole factor and evaluate).
- **Recognize removable singularities**: If the numerator has the same or higher power than the denominator after cancellation, or if the Laurent series has no negative powers, the singularity is removable and the residue is 0.

## Must-Memorize Formulas / Results
- **Residue Theorem**:
  $$\oint_C f(z) \, dz = 2\pi i \sum_{k} \text{Res}(f, z_k)$$
  where the sum is over all singularities $z_k$ inside the closed contour $C$.

- **Residue at a simple pole**:
  $$\text{Res}(f, z_0) = \lim_{z \to z_0} (z - z_0) f(z)$$

- **Residue at a pole of order $n$**:
  $$\text{Res}(f, z_0) = \frac{1}{(n-1)!} \lim_{z \to z_0} \frac{d^{n-1}}{dz^{n-1}} [(z - z_0)^n f(z)]$$

- **Residue from partial fractions** (for $\frac{P(z)}{Q(z)}$ with a simple pole at $z_0$):
  $$\text{Res}(f, z_0) = \frac{P(z_0)}{Q'(z_0)}$$
  (where $Q'$ is the derivative of the denominator)

- **Type of singularity from Laurent expansion**:
  - **Removable**: Laurent series has no negative powers; $\text{Res}(f, z_0) = 0$.
  - **Simple pole**: Laurent has exactly one negative power $(z - z_0)^{-1}$; $\text{Res}(f, z_0) = c_{-1}$.
  - **Higher-order pole of order $n$**: Laurent has negative powers down to $(z - z_0)^{-n}$; $\text{Res}(f, z_0) = c_{-1}$.
  - **Essential singularity**: Infinitely many negative powers.

- **Real integral via residues** (example):
  $$\int_0^{\infty} \frac{dx}{1 + x^2} = \frac{\pi}{2}$$
  (Close the contour in the upper half-plane; pole at $z = i$ with residue $\frac{1}{2i}$; integral is $2\pi i \cdot \frac{1}{2i} / 2 = \pi/2$.)
