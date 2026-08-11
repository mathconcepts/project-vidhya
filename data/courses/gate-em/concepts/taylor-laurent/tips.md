# Teaching Tips: Taylor & Laurent Series

## Common Student Errors
- **Confusing radius of convergence**: The radius of convergence of a Taylor series centered at $z_0$ is the distance to the nearest singularity, not the distance to a specific pole you pick. Always find ALL poles and take the minimum distance.
- **Forgetting negative powers in Laurent expansions**: Students sometimes write only the positive-power part of a Laurent series, ignoring the principal part. The principal part (negative powers) is the whole point of Laurent expansions — it encodes the singularity.
- **Incorrectly expanding $\frac{1}{1-z}$**: Students often forget that $\frac{1}{1-z} = \sum_{n=0}^{\infty} z^n$ only for $|z| < 1$. For $|z| > 1$, you must rewrite as $-\frac{1}{z-1} = -\frac{1}{z} \sum_{n=0}^{\infty} (1/z)^n = \sum_{n=1}^{\infty} \frac{(-1)^{n+1}}{z^n}$ (negative powers).

## GATE Question Pattern
GATE typically asks to: (1) write down the first few terms of a Taylor series (especially for standard functions like $\sin z, \cos z, e^z$), (2) find the radius of convergence by identifying singularities, (3) expand a function as a Laurent series in an annulus and extract the residue (coefficient of $z^{-1}$), or (4) determine the nature of a singularity (removable, pole, essential) from the Laurent expansion. A common trap: asking for the residue when the function is analytic at that point (residue = 0).

## Speed Tricks for MCQs
- **Memorize standard Taylor series**: 
  - $e^z = \sum_{n=0}^{\infty} \frac{z^n}{n!}$ (all $z$)
  - $\sin z = \sum_{n=0}^{\infty} \frac{(-1)^n z^{2n+1}}{(2n+1)!}$ (all $z$)
  - $\cos z = \sum_{n=0}^{\infty} \frac{(-1)^n z^{2n}}{(2n)!}$ (all $z$)
  - $\frac{1}{1-z} = \sum_{n=0}^{\infty} z^n$ (for $|z| < 1$)
  These appear in almost every exam; knowing them saves time.
- **Identify pole location = radius of convergence**: For a Taylor series at $z_0$, plot the poles in the complex plane and find the nearest one. Its distance from $z_0$ is $R$.
- **Use partial fractions for Laurent expansions**: Break the integrand into simple terms (poles at different locations), expand each separately for the desired annulus, and combine. Much faster than computing residues by hand.

## Must-Memorize Formulas / Results
- **Taylor Series**:
  $$f(z) = \sum_{n=0}^{\infty} a_n (z - z_0)^n, \quad a_n = \frac{f^{(n)}(z_0)}{n!}$$
  Converges for $|z - z_0| < R$, where $R$ is the distance to the nearest singularity.

- **Laurent Series**:
  $$f(z) = \sum_{n=-\infty}^{\infty} c_n (z - z_0)^n$$
  where $c_n = \frac{1}{2\pi i} \oint_C \frac{f(z)}{(z - z_0)^{n+1}} dz$ ($C$ any closed contour in the annulus of analyticity).

- **Residue from Laurent expansion**: The residue at $z_0$ is $\text{Res}(f, z_0) = c_{-1}$ (coefficient of $(z - z_0)^{-1}$).

- **Residue formula for simple pole**:
  $$\text{Res}(f, z_0) = \lim_{z \to z_0} (z - z_0) f(z)$$

- **Residue formula for pole of order $n$**:
  $$\text{Res}(f, z_0) = \frac{1}{(n-1)!} \lim_{z \to z_0} \frac{d^{n-1}}{dz^{n-1}}[(z - z_0)^n f(z)]$$

- **Type of singularity from Laurent expansion**:
  - No negative powers: removable singularity
  - Finitely many negative powers: pole (order = highest negative power)
  - Infinitely many negative powers: essential singularity
