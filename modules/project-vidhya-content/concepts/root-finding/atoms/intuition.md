---
id: root-finding-intuition
concept_id: root-finding
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
---

# Root-Finding Methods

A **root** (or zero) of $f(x)$ is any $x^*$ satisfying $f(x^*) = 0$. Closed-form solutions are often impossible, so numerical methods are essential in GATE Mathematics.

---

## Bisection Method

**Idea:** If $f(a)$ and $f(b)$ have opposite signs, the Intermediate Value Theorem guarantees at least one root in $[a, b]$. Repeatedly halve the interval, keeping the half that contains the sign change.

**Update rule:** Let $c = (a+b)/2$.
- If $f(a)\,f(c) < 0$, set $b = c$
- Else set $a = c$

**Convergence:** *Linear* — the error halves each iteration.

$$e_{n+1} \leq \frac{b - a}{2^{n+1}}$$

After $n$ iterations the bracket width is $(b-a)/2^n$. To achieve tolerance $\varepsilon$:

$$n \geq \log_2\!\left(\frac{b-a}{\varepsilon}\right)$$

**Drawback:** Slow. Does not use slope information. Always converges (if the initial bracket is valid).

---

## Newton-Raphson Method

**Idea:** Approximate $f$ by its tangent line at $x_n$ and solve for the next iterate.

$$x_{n+1} = x_n - \frac{f(x_n)}{f'(x_n)}$$

**Convergence:** *Quadratic* near a simple root — the number of correct decimal digits roughly doubles each iteration.

$$|e_{n+1}| \approx \frac{|f''(x^*)|}{2|f'(x^*)|}\,|e_n|^2$$

**Conditions for convergence:**
- $f'(x_n) \neq 0$ at each iterate
- Starting point $x_0$ sufficiently close to $x^*$
- $f$ twice continuously differentiable near $x^*$

**When it fails:** Oscillates if $x_0$ is far from $x^*$; diverges if $f'(x_n) \approx 0$; stalls at repeated roots (convergence drops to linear).

---

## Secant Method

When $f'$ is expensive or unavailable, replace it with a finite-difference approximation:

$$x_{n+1} = x_n - f(x_n)\,\frac{x_n - x_{n-1}}{f(x_n) - f(x_{n-1})}$$

Requires **two** starting points $x_0, x_1$ but no derivative evaluation.

**Convergence order:** $\approx 1.618$ (super-linear but sub-quadratic — the golden ratio).

---

## Convergence Criteria (Stopping Rules)

| Criterion | Formula | Meaning |
|---|---|---|
| Absolute residual | $\|f(x_n)\| < \varepsilon$ | Function value near zero |
| Absolute step | $\|x_{n+1} - x_n\| < \delta$ | Iterates stopped moving |
| Relative step | $\|x_{n+1}-x_n\|/\|x_n\| < \delta$ | Scale-invariant |

In GATE problems, combine residual + step size checks to be safe.

---

## Error Bounds Summary

| Method | Error order | Typical GATE use |
|---|---|---|
| Bisection | $O(2^{-n})$ — linear | Guaranteed bracket; slow |
| Newton-Raphson | $O(e_n^2)$ — quadratic | Fast; needs $f'$; may diverge |
| Secant | $O(e_n^{1.618})$ — super-linear | NR without derivatives |

**Key GATE fact:** Newton-Raphson achieves quadratic convergence near a *simple* root. At a root of multiplicity $m > 1$ it degrades to linear convergence unless modified.
