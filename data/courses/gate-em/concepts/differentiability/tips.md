# Teaching Tips: Differentiability

## Common Student Errors

- **Confusing continuity and differentiability:** Students think "continuous = differentiable" or vice versa. Truth: Differentiability $\Rightarrow$ continuity, but not the reverse.
- **Ignoring corners and cusps:** When checking differentiability at a point, students forget to look for sharp bends. $|x|$, $\sqrt[3]{x}$, and absolute value functions are classic traps.
- **Not computing one-sided derivatives:** When checking differentiability at a piecewise boundary, students only compute one side or don't check if left = right.

## GATE Question Pattern

GATE asks: (1) Is this function differentiable at a point (MCQ)? Often a piecewise function or one with absolute value. (2) Find the value of a parameter so a piecewise function is differentiable (NAT). (3) Count the number of non-differentiable points in an interval (2-mark MCQ). Piecewise and absolute-value functions dominate.

## Speed Tricks for MCQs

- **Absolute value rule:** $f(x) = |g(x)|$ is not differentiable where $g(x) = 0$ (the sharp points), UNLESS $g'(0) = 0$ as well (rare).
- **Piecewise corner test:** At a boundary $x = a$, compute $f'(a^-) = \lim_{h \to 0^-} \frac{f(a+h) - f(a)}{h}$ and $f'(a^+) = \lim_{h \to 0^+} \frac{f(a+h) - f(a)}{h}$. If equal, differentiable; if not, not differentiable.
- **Smooth functions:** Polynomials, $e^x$, $\sin(x)$, $\cos(x)$, $\ln(x)$ (on their domains) are differentiable everywhere in their domain.

## Must-Memorize Formulas / Results

- **Differentiability definition:** $f'(a) = \lim_{h \to 0} \frac{f(a+h) - f(a)}{h}$ (must exist and be finite).
- **Differentiability $\Rightarrow$ Continuity:** If $f$ is differentiable at $a$, then $f$ is continuous at $a$.
- **Converse is false:** Continuous $\not\Rightarrow$ differentiable. Example: $f(x) = |x|$ is continuous at $x = 0$ but not differentiable.
- **One-sided derivatives:** $f'(a^-) = \lim_{h \to 0^-} \frac{f(a+h) - f(a)}{h}$ (left), $f'(a^+) = \lim_{h \to 0^+} \frac{f(a+h) - f(a)}{h}$ (right).
- **Differentiable $\Leftrightarrow$ Left derivative = right derivative.**
