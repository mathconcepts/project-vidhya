# Teaching Tips: Analytic Functions

## Common Student Errors
- **Sign errors in Cauchy-Riemann**: Students often write $\frac{\partial u}{\partial y} = \frac{\partial v}{\partial x}$ instead of $\frac{\partial u}{\partial y} = -\frac{\partial v}{\partial x}$ (forgetting the minus sign). The minus sign is critical — it encodes the 90° rotation property of complex multiplication.
- **Assuming continuity of partials implies analyticity**: Just because partial derivatives exist and are continuous does NOT guarantee Cauchy-Riemann holds. For example, $f(z) = |z|^2 = x^2 + y^2$ has continuous partials everywhere, but violates C-R except at the origin.
- **Confusing analytic with holomorphic**: In GATE, these terms are interchangeable. "Analytic" and "holomorphic" both mean "complex-differentiable." Don't be thrown off by terminology.

## GATE Question Pattern
GATE typically asks: (1) determine if a function is analytic using Cauchy-Riemann, (2) find the harmonic conjugate given one component, (3) identify which function families are analytic everywhere (polynomials, $e^z$, $\sin z$, $\cos z$ are; $\bar{z}$, $|z|$, $\text{Re}(z)$ are not). Watch for questions where they give you a poorly defined real part and ask for the imaginary part — if C-R can't be satisfied, the answer is "no analytic function exists."

## Speed Tricks for MCQs
- **Recognize standard analytic functions**: Polynomials, $e^z$, $\sin z$, $\cos z$, $\cosh z$, $\sinh z$, and $\log z$ (on a slit domain) are all analytic. Learn to identify them fast.
- **Use the derivative formula directly**: Once you confirm Cauchy-Riemann holds, $f'(z) = \frac{\partial u}{\partial x} + i \frac{\partial v}{\partial x} = \frac{\partial v}{\partial y} - i \frac{\partial u}{\partial y}$ gives you the derivative instantly without integration.
- **Check one C-R equation first**: If one equation fails, you're done — the function is not analytic. No need to compute both equations if the first one already doesn't hold.

## Must-Memorize Formulas / Results
- **Cauchy-Riemann Equations (two forms)**:
  $$\frac{\partial u}{\partial x} = \frac{\partial v}{\partial y}, \quad \frac{\partial u}{\partial y} = -\frac{\partial v}{\partial x}$$
- **Complex derivative**:
  $$f'(z) = \frac{\partial u}{\partial x} + i \frac{\partial v}{\partial x} = \frac{\partial v}{\partial y} - i \frac{\partial u}{\partial y}$$
- **Harmonic functions**: If $f = u + iv$ is analytic, then $u$ and $v$ satisfy Laplace's equation: $\nabla^2 u = \frac{\partial^2 u}{\partial x^2} + \frac{\partial^2 u}{\partial y^2} = 0$ (and similarly for $v$).
- **Standard analytic functions**: 
  - $\sin z = \sin x \cosh y + i \cos x \sinh y$
  - $\cos z = \cos x \cosh y - i \sin x \sinh y$
  - $e^z = e^x(\cos y + i \sin y)$
  - $\log z = \log|z| + i \arg z$ (on a slit domain)
- **Derivatives of standard functions**:
  - $\frac{d}{dz} \sin z = \cos z$
  - $\frac{d}{dz} \cos z = -\sin z$
  - $\frac{d}{dz} e^z = e^z$
  - $\frac{d}{dz} z^n = n z^{n-1}$ (for any integer or real $n$)
