---
id: multivariable-calculus.intuition
concept_id: multivariable-calculus
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
---

## Partial Derivatives: Taking One Step at a Time

In single-variable calculus, the derivative $\frac{df}{dx}$ measures how a function changes as you move along the x-axis. But what happens when a function depends on multiple variables?

Imagine you're standing on a hillside at position $(x, y)$ with elevation $z = f(x, y)$. The slope you feel depends on which direction you walk:
- If you walk east (increasing $x$ while holding $y$ constant), you experience a certain steepness.
- If you walk north (increasing $y$ while holding $x$ constant), the slope might be completely different.

**Partial derivatives** measure these directional slopes separately. The **partial derivative with respect to $x$**, written $\frac{\partial f}{\partial x}$, shows how the function changes when only $x$ varies—as if you froze $y$ in place. Similarly, $\frac{\partial f}{\partial y}$ shows change along the $y$ direction.

The **Jacobian** takes this further: it collects all partial derivatives into a matrix that fully describes how a multivariable function changes near a point. It's the multivariable equivalent of a single derivative—a complete snapshot of the rate of change in every direction.

For exam problems, you'll compute partial derivatives by treating all variables except one as constants, then differentiate normally. The Jacobian appears in transformation problems and when analyzing how functions behave near critical points.
```

---

## ATOM 2: Visual Analogy

**File:**
