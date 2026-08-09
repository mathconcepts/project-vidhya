# Teaching Tips: Inverse Laplace Transform

## Common Student Errors

- **Forgetting to rewrite the numerator for complex-pole cases:** When the denominator has a quadratic $(s^2 + 2\sigma s + \sigma^2 + \omega^2)$ and the numerator is linear, students often don't decompose the numerator into a part proportional to the derivative of the denominator plus a constant. This misses the $\cos$ and $\sin$ split. **Always complete the square and rewrite the numerator in the form $A(s+\sigma) + B$.**
- **Mixing up standard pair forms:** $\mathcal{L}^{-1}\left\{\frac{1}{s+a}\right\} = e^{-at}$ but $\mathcal{L}^{-1}\left\{\frac{1}{(s+a)^2}\right\} = te^{-at}$. The latter has a factor of $t$ in front. Many students drop this $t$.
- **Not handling repeated poles correctly:** For a repeated pole like $\frac{1}{(s+a)^n}$, the inverse transform is $\frac{t^{n-1}}{(n-1)!} e^{-at}$, not just $e^{-at}$. The polynomial power in $t$ encodes the pole multiplicity.

## GATE Question Pattern

Inverse Laplace problems in GATE follow a predictable sequence: **(1) Simple pole matching** (one or two distinct real poles), **(2) Repeated-pole identification** (factor like $(s+a)^2$ or $(s+a)^3$), or **(3) Complex-pole decomposition** (complete square, then split into $\cos$/$\sin$ terms). Multi-step problems combine these—e.g., "Solve the ODE $y'' + 3y' + 2y = 0$ with $y(0) = 0, y'(0) = 1$ using Laplace transforms." The trap is incomplete numerator rewriting when complex poles are involved.

## Speed Tricks for MCQs

- **Pole-location rule of thumb:** Pole at $s = -a$ → time domain has $e^{-at}$. Repeated pole at $s = -a$ with multiplicity $n$ → factor $t^{n-1}e^{-at}$. Complex-conjugate poles at $s = -\sigma \pm j\omega$ → damped sinusoid $e^{-\sigma t}(\cos(\omega t) + \ldots)$. Knowing this instantly eliminates half the wrong answers.
- **Numerator rewriting shortcut:** For $\frac{P(s)}{(s+\sigma)^2 + \omega^2}$, rewrite numerator as $P(s) = A(s+\sigma) + B\omega$. Then split: $\frac{A(s+\sigma)}{(s+\sigma)^2+\omega^2} + \frac{B\omega}{(s+\sigma)^2+\omega^2}$. The first matches $\cos$; the second matches $\sin$. Avoids residue calculation for complex poles.
- **Check dimensionality:** After inverse transform, dimensions should match. If $F(s)$ has units of [1/s], then $f(t)$ has units [1]. A factor of $t$ in $te^{-at}$ doesn't change units since $t$ is dimensionless; decay rate $a$ has units [1/time].

## Must-Memorize Standard Pairs

| Time Domain $f(t)$ | Laplace Domain $F(s)$ |
|---|---|
| $1$ | $\frac{1}{s}$ |
| $e^{-at}$ | $\frac{1}{s+a}$ |
| $t$ | $\frac{1}{s^2}$ |
| $te^{-at}$ | $\frac{1}{(s+a)^2}$ |
| $t^n e^{-at}$ | $\frac{n!}{(s+a)^{n+1}}$ |
| $\sin(\omega t)$ | $\frac{\omega}{s^2+\omega^2}$ |
| $\cos(\omega t)$ | $\frac{s}{s^2+\omega^2}$ |
| $e^{-at}\sin(\omega t)$ | $\frac{\omega}{(s+a)^2+\omega^2}$ |
| $e^{-at}\cos(\omega t)$ | $\frac{s+a}{(s+a)^2+\omega^2}$ |

**Key partial-fraction decomposition steps:**

$$\frac{P(s)}{(s+a)(s+b)} = \frac{A}{s+a} + \frac{B}{s+b}$$

Use the "cover-up" method: $A = \frac{P(-a)}{-a+b}$, $B = \frac{P(-b)}{-b+a}$.

For repeated poles $(s+a)^2$:
$$\frac{P(s)}{(s+a)^2} = \frac{A}{s+a} + \frac{B}{(s+a)^2}$$

For complex poles, complete the square first: $s^2 + 2\sigma s + \omega^2 = (s+\sigma)^2 + (\omega^2 - \sigma^2)$.
