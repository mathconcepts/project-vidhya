# Teaching Tips: Laplace Transform

## Common Student Errors

- **Forgetting the region of convergence (ROC):** Students compute $F(s)$ but ignore Re$(s) > \sigma_c$. In GATE problems, the ROC is often part of the answer and distinguishes between left-sided, right-sided, and two-sided signals.
- **Confusing shift/translation rules:** Time-shift ($f(t-a)$) gives $e^{-as}F(s)$, while frequency-shift ($e^{-at}f(t)$) gives $F(s+a)$. Mixing these is a classic error. Remember: **time delays multiply by exponential in $s$; frequency shifts add to the pole.**
- **Polynomial numerator errors:** For $\mathcal{L}\{t^n f(t)\}$, the rule is $(-1)^n \frac{d^n}{ds^n} F(s)$, not simple multiplication. Many students incorrectly multiply by $t^n$ directly in the $s$-domain.

## GATE Question Pattern

GATE typically presents Laplace transform problems in three forms: **(1) Direct transform identification** (given $f(t)$, find $F(s)$), **(2) Inverse transform via partial fractions** (given $F(s)$, decompose and match to standard pairs), and **(3) System analysis** (find impulse response, pole locations, stability). Multi-step problems chain these—e.g., "Given a differential equation, find the Laplace transform, simplify, and determine if the system is stable based on pole locations." The trap is incomplete partial-fraction decomposition or forgetting to check pole multiplicity.

## Speed Tricks for MCQs

- **Memorize the 6–8 standard pairs:** $\mathcal{L}\{1\} = \frac{1}{s}$, $\mathcal{L}\{t^n\} = \frac{n!}{s^{n+1}}$, $\mathcal{L}\{e^{-at}\} = \frac{1}{s+a}$, $\mathcal{L}\{\sin(\omega t)\} = \frac{\omega}{s^2+\omega^2}$, $\mathcal{L}\{\cos(\omega t)\} = \frac{s}{s^2+\omega^2}$. Recognizing these instantly saves minutes.
- **Partial fractions shortcut:** For $\frac{P(s)}{(s+a)(s+b)}$ with simple poles, use the "cover-up" method: $A = \frac{P(-a)}{-a+b}$, $B = \frac{P(-b)}{-b+a}$. Avoids solving linear systems.
- **Pole-location stability at a glance:** All poles strictly left of the imaginary axis ($\text{Re}(s) < 0$) → stable. If any pole is on the imaginary axis → marginal. Any pole right of → unstable. This one-second check often answers 1/3 of a system-analysis question.

## Must-Memorize Formulas / Results

$$\mathcal{L}\{f(t-a)u(t-a)\} = e^{-as} F(s) \quad \text{(time-shift property)}$$

$$\mathcal{L}\{e^{-at} f(t)\} = F(s+a) \quad \text{(frequency-shift / damping property)}$$

$$\mathcal{L}\{t^n f(t)\} = (-1)^n \frac{d^n F(s)}{ds^n} \quad \text{(multiplication by } t \text{)}$$

$$\mathcal{L}\left\{\frac{df}{dt}\right\} = s F(s) - f(0^+) \quad \text{(differentiation in time)}$$

$$\mathcal{L}\left\{\int_0^t f(\tau) d\tau\right\} = \frac{F(s)}{s} \quad \text{(integration in time)}$$

**Standard pairs:**
- $\mathcal{L}\{t^n\} = \frac{n!}{s^{n+1}}$
- $\mathcal{L}\{e^{-at}\} = \frac{1}{s+a}$
- $\mathcal{L}\{\sin(\omega t)\} = \frac{\omega}{s^2+\omega^2}$
- $\mathcal{L}\{\cos(\omega t)\} = \frac{s}{s^2+\omega^2}$
- $\mathcal{L}\{e^{-at}\sin(\omega t)\} = \frac{\omega}{(s+a)^2+\omega^2}$
- $\mathcal{L}\{e^{-at}\cos(\omega t)\} = \frac{s+a}{(s+a)^2+\omega^2}$
