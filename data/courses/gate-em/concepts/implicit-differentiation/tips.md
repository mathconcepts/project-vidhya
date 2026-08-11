# Implicit Differentiation — GATE Tips & Common Errors

## The #1 Error: Forgetting the Chain Rule on y-terms

When you see $y^n$, $\sin y$, $e^y$ — any function of $y$ — you MUST multiply by $\frac{dy}{dx}$ after differentiating.

| Expression | Correct derivative w.r.t. x | Common wrong answer |
|---|---|---|
| $y^2$ | $2y \cdot \dfrac{dy}{dx}$ | $2y$ (forgot $dy/dx$) |
| $y^3$ | $3y^2 \cdot \dfrac{dy}{dx}$ | $3y^2$ |
| $\sin y$ | $\cos y \cdot \dfrac{dy}{dx}$ | $\cos y$ |
| $e^y$ | $e^y \cdot \dfrac{dy}{dx}$ | $e^y$ |

**Rule**: every y-term gets an extra $\frac{dy}{dx}$ factor. This IS the chain rule — y is the inner function of x.

---

## GATE Pattern Recognition

**1-mark questions** typically ask you to:
- Find $\frac{dy}{dx}$ for a standard curve (circle, ellipse, hyperbola, $xy = c$)
- Evaluate at a specific point

**2-mark questions** typically ask you to:
- Differentiate a more complex implicit curve (e.g., folium, cubic curves)
- Find $\frac{d^2y}{dx^2}$ and evaluate at a point
- Find the equation of a tangent or normal line

---

## Speed Tricks for GATE

**Treat $\frac{dy}{dx}$ as an unknown and solve algebraically.** After one pass of differentiation, collect all terms with $\frac{dy}{dx}$ on one side:

$$\text{[stuff]} \cdot \frac{dy}{dx} = \text{[other stuff]} \implies \frac{dy}{dx} = \frac{\text{[other stuff]}}{\text{[stuff]}}$$

No substitution or rearrangement mid-step — just isolate at the end.

**For $d^2y/dx^2$**: use the general formula derived once and plug in:
$$\frac{d^2y}{dx^2} = -\frac{x^2 + y^2}{y^3} \quad \text{(for } x^2+y^2 = r^2\text{)}$$

Memorize this for the circle so you skip rederiving it under exam pressure.

**Product rule alert on $xy$ terms**: $\frac{d}{dx}(xy) = y + x\frac{dy}{dx}$ (not just $y$, not just $x\frac{dy}{dx}$).

---

## Common Errors Summary

1. **Dropped $dy/dx$**: differentiating $y^2$ as $2y$ instead of $2y\,dy/dx$.
2. **Product rule omission**: treating $xy$ as $x \cdot \text{const}$ and writing $y$ instead of $y + x\,dy/dx$.
3. **Sign error**: after moving $dy/dx$ terms, forgetting to flip the sign of the remaining terms.
4. **Substitution too early**: plugging in the point values BEFORE solving for $dy/dx$ (creates circular algebra).
5. **Wrong point-slope form**: writing $y = mx + b$ using the curve's equation rather than the tangent formula $y - y_0 = m(x - x_0)$.
