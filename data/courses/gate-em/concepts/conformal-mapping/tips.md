# Teaching Tips: Conformal Mapping

## Common Student Errors
- **Confusing "analytic" with "conformal"**: A function is analytic if it's complex-differentiable (satisfies Cauchy-Riemann). It is **conformal** if it's analytic AND $f'(z) \neq 0$. Example: $f(z) = z^2$ is analytic everywhere but NOT conformal at $z = 0$ (where $f'(0) = 0$).
- **Forgetting that angle preservation is **local****: Conformal maps preserve angles only in a small neighborhood around a point. They may distort global shapes dramatically. Example: $e^z$ maps the entire complex plane conformally, but the image is only the right half-plane $\{w : \text{Re}(w) > 0\}$... wait, that's not right. Let me reconsider. Actually, $e^z$ maps the entire plane to $\mathbb{C} \setminus \{0\}$ conformally (the plane minus the origin). Students sometimes assume angles are preserved globally, which is false.
- **Missing the singularities**: When checking if a map is conformal, always verify that $f'(z) \neq 0$ at the point in question. A zero derivative means the map is NOT conformal there, even if the function is analytic.

## GATE Question Pattern
GATE questions on conformal maps typically: (1) ask whether a given function is conformal at a specified point (check analyticity and $f'(z) \neq 0$), (2) compute the image of a region or curve under a simple conformal map (e.g., $z^n$, $e^z$, $\sin z$, $\frac{1}{z}$), (3) determine the scaling factor at a point, or (4) verify the angle-preserving property. These problems often combine concepts from earlier topics (analyticity, derivatives, polar form).

## Speed Tricks for MCQs
- **Memorize derivatives of standard maps**: $\frac{d}{dz} z^n = nz^{n-1}$, $\frac{d}{dz} e^z = e^z$, $\frac{d}{dz} \sin z = \cos z$, $\frac{d}{dz} \frac{1}{z} = -\frac{1}{z^2}$, $\frac{d}{dz} \log z = \frac{1}{z}$. These are used constantly in conformality checks.
- **Scaling factor is $|f'(z)|$**: Once you know the derivative, the magnification is just its magnitude. No need to compute Jacobians or solve for the scaling in another way.
- **Recognize standard conformal maps**: $z^2$ doubles angles, $e^z$ maps vertical lines to circles, $\frac{1}{z}$ inverts (maps disks to disks/half-planes), $\sin z$ and $\cos z$ are conformal away from zeros of their derivatives. Knowing these patterns saves time.

## Must-Memorize Formulas / Results
- **Definition**: $f(z)$ is conformal at $z_0$ if:
  1. $f$ is analytic at $z_0$ (Cauchy-Riemann hold, all partials continuous).
  2. $f'(z_0) \neq 0$.

- **Scaling factor** at a point $z$ under a conformal map $f$:
  $$\text{Magnification} = |f'(z)|$$

- **Angle preservation**: If two curves intersect at angle $\alpha$ at $z_0$, their images intersect at the same angle $\alpha$ at $f(z_0)$ (assuming $f$ is conformal at $z_0$).

- **Jacobian determinant**: For $f(z) = u(x,y) + iv(x,y)$ conformal,
  $$J = \det\begin{pmatrix} u_x & u_y \\ v_x & v_y \end{pmatrix} = |f'(z)|^2$$
  The determinant is positive, ensuring local invertibility.

- **Standard conformal maps**:
  - $w = z^n$ (n ≥ 2): multiplies angles by $n$, not conformal at $z = 0$.
  - $w = e^z$: conformal everywhere; maps strips to angular sectors; vertical lines $\to$ circles centered at origin.
  - $w = \sin z$: conformal everywhere except at $z = \pm \pi/2 + n\pi$ (where $\cos z = 0$).
  - $w = \frac{1}{z}$: conformal everywhere except $z = 0$; inverts circles.
  - $w = \log z$: conformal everywhere except $z = 0$ (and along a branch cut).
  - Möbius transformation $w = \frac{az + b}{cz + d}$ (where $ad - bc \neq 0$): conformal everywhere except at pole.

- **Conformal mapping solves Laplace's equation**: If $u$ is harmonic in region $D$, and $f$ is conformal, then $u \circ f^{-1}$ is harmonic in the image region. This is the foundation of using conformal maps to solve boundary value problems.
