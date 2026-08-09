# Teaching Tips: Laplace Applications

## Common Student Errors

- **Forgetting or misapplying initial conditions:** The derivative rule is $\mathcal{L}\{y'\} = sY(s) - y(0)$, not just $sY(s)$. Many students skip the $-y(0)$ term, destroying the solution. Double-check: substitute $s \to 0$ in your final $Y(s)$ to verify the initial value is correct.
- **Errors in partial-fraction decomposition of complex rational functions:** When $Y(s)$ has a high-degree denominator (e.g., $(s+1)^2(s+2)(s+3)$), students often make sign or coefficient mistakes in the partial fractions. Use the **cover-up method** strictly, or verify by plugging in test values of $s$ after decomposition.
- **Applying the Final Value Theorem incorrectly:** The theorem $\lim_{t \to \infty} y(t) = \lim_{s \to 0^+} s Y(s)$ is valid **only if** all poles of $Y(s)$ lie in the left half-plane (or on the imaginary axis). If a pole is at $s=0$ or in the right half-plane, the theorem doesn't apply, and $y(t)$ diverges or oscillates unboundedly.

## GATE Question Pattern

Laplace applications in GATE manifest in three main scenarios: **(1) Solve ODE with given initial conditions** (1st or 2nd order, often with constant or exponential RHS), **(2) Find steady-state system response** (step input, impulse, or sinusoidal), and **(3) Transfer-function analysis** (given $H(s)$, analyze stability, DC gain, step response, etc.). Multi-step problems chain these—e.g., "Given a 2nd-order differential equation, (a) find the transfer function, (b) determine if the system is stable, (c) compute the unit-step response." The traps: forgetting initial conditions, mishandling repeated poles, and misapplying frequency-domain theorems.

## Speed Tricks for MCQs

- **Inverse-transform decomposition pattern:** For an ODE solution, the form is always $y(t) = \text{[homogeneous solution]} + \text{[particular solution]}$. Poles in the left half-plane → transients die off. The steady-state (long-term behavior) is determined by poles on the imaginary axis (marginal) or zero pole (DC response). Recognize this structure to instantly pick the right answer.
- **Final Value Theorem shortcut:** For a stable system (all poles left half-plane) with a step input, the steady-state output is $y_\infty = H(0) \cdot \text{input amplitude} = \frac{\text{DC gain}}{1}$. For $H(s) = \frac{k}{(s+a)(s+b)}$, the DC gain is $H(0) = \frac{k}{ab}$. This one-step calculation skips the full inverse transform.
- **Pole-multiplicity hint:** A repeated pole at $s=-a$ of multiplicity $n$ always produces a factor $t^{n-1} e^{-at}$ in the time domain. Use this to eliminate wrong answers instantly.

## Must-Memorize Theorems & Formulas

**Linearity of Laplace Transform:**
$$\mathcal{L}\{a f(t) + b g(t)\} = a F(s) + b G(s)$$

**Differentiation in Time (with initial conditions):**
$$\mathcal{L}\left\{\frac{df}{dt}\right\} = s F(s) - f(0^+)$$
$$\mathcal{L}\left\{\frac{d^2f}{dt^2}\right\} = s^2 F(s) - s f(0^+) - f'(0^+)$$

**Integration in Time:**
$$\mathcal{L}\left\{\int_0^t f(\tau) d\tau\right\} = \frac{F(s)}{s}$$

**Convolution Theorem:**
$$\mathcal{L}\{f(t) * g(t)\} = F(s) \cdot G(s)$$
where $f(t) * g(t) = \int_0^t f(\tau) g(t-\tau) d\tau$.

**Final Value Theorem (valid if poles in LHP or on imaginary axis):**
$$\lim_{t \to \infty} f(t) = \lim_{s \to 0^+} s F(s)$$

**Initial Value Theorem:**
$$f(0^+) = \lim_{s \to \infty} s F(s)$$

**Transfer Function (for LTI systems):**
$$H(s) = \frac{Y(s)}{X(s)} = \frac{\text{Laplace of impulse response}}{1} = \mathcal{L}\{h(t)\}$$

**DC Gain (steady-state gain for step input):**
$$\text{DC Gain} = H(0) = \lim_{s \to 0} H(s)$$

**Stability Criterion (BIBO stable iff all poles in left half-plane):**
- All poles Re$(s_i) < 0$ → stable, bounded output for bounded input
- Any pole Re$(s_i) > 0$ → unstable, unbounded response
- Pole at Re$(s_i) = 0$ → marginally stable (on boundary)
