---
id: pde-basics-visual-analogy
concept_id: pde-basics
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.30
exam_ids: [gate-ma]
scaffold_fade: 0
---

## The Weather Map Analogy

A weather map assigns a **temperature** $u(x, y, t)$ to every point on the ground $(x, y)$ at every moment in time $t$. This is a function of three independent variables — exactly the kind of quantity that PDEs govern.

**The heat equation** $u_t = \alpha\, u_{xx}$ says: the rate at which temperature changes over time at a point equals a constant times the "curvature" of the temperature profile in space. A hot spot in the middle of a cold field cools down (negative curvature → negative $u_t$); a cold valley surrounded by warmth heats up.

**The wave equation** $u_{tt} = c^2 u_{xx}$ governs propagating disturbances. A pressure pulse from a thunderclap travels outward at speed $c$ without changing shape — a **travelling wave** $u(x,t) = f(x - ct)$.

**The Laplace equation** $u_{xx} + u_{yy} = 0$ governs *steady-state* temperature — after the weather system has been in the same pattern for so long that $u_t = 0$. The temperature at any interior point equals the **average of its surroundings** (mean-value property), so no hot-spots or cold-spots can exist in the interior.

---

**The classification matters physically:**

- **Elliptic** (Laplace): no time, smooth everywhere, boundary data fully determines the interior.
- **Parabolic** (Heat): time flows forward; initial temperature profile diffuses and smoothes.
- **Hyperbolic** (Wave): sharp fronts persist; disturbances travel at finite speed.

---

The animation on this card shows a travelling wave — a solution $u(x,t) = e^{-x^2 \cdot 0.1}\cos(x - 2t)$ of the wave equation — sweeping to the right:

```gif-scene
{
  "type": "parametric",
  "expression": "exp(-x*x * 0.1) * cos(x - t * 2)",
  "x_range": [-10, 10],
  "y_range": [-1.5, 1.5],
  "label": "Wave equation solution: traveling wave"
}
```

**Reading the plot.** The Gaussian envelope $e^{-0.1x^2}$ localises the disturbance spatially. The cosine carrier moves rigidly to the right at speed $c = 2$ as $t$ increases. This is the hallmark of a **hyperbolic** PDE: information travels at a finite speed along **characteristics** $x - ct = \text{const}$.
