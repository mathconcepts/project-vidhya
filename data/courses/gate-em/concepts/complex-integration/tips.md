# Teaching Tips: Complex Integration

## Common Student Errors
- **Forgetting to check if poles are inside the contour**: Students often write down $2\pi i \cdot f(z_0)$ without verifying that $z_0$ actually lies inside the contour. If it's outside, the integral is zero by Cauchy's theorem.
- **Incorrectly applying Cauchy's formula to non-analytic integrands**: Cauchy's formula $\oint_C \frac{f(z)}{z - z_0} dz = 2\pi i f(z_0)$ only works if $f$ is analytic inside and on $C$. If the integrand has other singularities inside, you need residue calculus instead.
- **Confusing pole order**: A simple pole at $z_0$ gives $2\pi i \cdot (\text{residue})$. A pole of order 2 requires the derivative formula: $2\pi i \cdot f'(z_0)$. Students often use the simple formula for all pole orders.

## GATE Question Pattern
GATE typically asks to: (1) evaluate a line integral around a closed contour using Cauchy's theorem (for analytic integrands), (2) apply Cauchy's integral formula to extract a function value from a contour integral, (3) evaluate integrals with one or more poles using partial fractions and the formula, or (4) handle poles of order ≥ 2 using higher-order formulas. A classic trap: asking for an integral where all poles lie outside the contour, making the answer zero despite a complicated-looking denominator.

## Speed Tricks for MCQs
- **Pole location first**: Before doing any computation, identify the poles and quickly check if they're inside or outside the contour. If all are outside, the integral is zero by Cauchy's theorem — answer found instantly.
- **Partial fractions for multiple poles**: If there are multiple poles, split the integrand into simpler fractions. Each contributes $2\pi i \times$ (its residue). For simple poles, the residue is the numerator after cancelling the pole factor.
- **Recognize $\frac{1}{z - a}$ patterns**: $\oint_C \frac{1}{z - a} dz = 2\pi i$ if $a$ is inside $C$, and $0$ otherwise. This pattern appears constantly; memorize it.

## Must-Memorize Formulas / Results
- **Cauchy's Integral Theorem**: If $f$ is analytic on and inside a closed contour $C$, then $\oint_C f(z) \, dz = 0$.
- **Cauchy's Integral Formula** (simple pole):
  $$\oint_C \frac{f(z)}{z - z_0} \, dz = 2\pi i \cdot f(z_0)$$
  (if $z_0$ is inside $C$ and $f$ is analytic inside and on $C$).
- **Higher-order pole formula** (pole of order $n$ at $z_0$):
  $$\oint_C \frac{f(z)}{(z - z_0)^n} \, dz = 2\pi i \cdot \frac{f^{(n-1)}(z_0)}{(n-1)!}$$
- **Winding number**: $\oint_C \frac{1}{z - z_0} \, dz = 2\pi i \times (\text{winding number of } C \text{ around } z_0)$. For a simple counterclockwise loop, the winding number is 1 if $z_0$ is inside, 0 if outside.
- **Key special case**: $\oint_C \frac{1}{z^n} \, dz = 0$ for $n \neq 1$ (pole at $z=0$ gives zero unless $n=1$, in which case the integral is $2\pi i$).
- **Partial fraction decomposition**: Always use this to split complicated rational functions before applying Cauchy's formulas to each term individually.
