---
id: integration-by-parts.visual_analogy
concept_id: integration-by-parts
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.30
exam_ids: ["*"]
scaffold_fade: true
---

# Integration by Parts: The Leverage Analogy

Think of integration by parts like **using leverage to move a heavy object**. Instead of pushing the entire weight directly, you use a fulcrum and apply force at a strategic point.

## The Analogy

In calculus, we have a "heavy" integral $\int f(x) \cdot g(x) \, dx$ that we can't compute directly. Integration by parts says: "Don't push directly. Instead, find a fulcrum—call it $u$—and rotate the problem." By differentiating $u$ (reducing its 'weight'), we transfer that effort to integrating $dv$ (the 'load').

The formula $\int u \, dv = uv - \int v \, du$ is like the mechanical advantage equation: we trade complexity in one direction for simplicity in another.

## Seeing the Trade-Off

Look at $\int x \sin(x) \, dx$ below. The graph shows how the original function oscillates with growing amplitude. Integration by parts lets us break this into pieces: we "reduce the weight" by differentiating the polynomial $x$, leaving us with a purely trigonometric integral on the right side—much more tractable.

```gif-scene
{"type":"function-trace","expression":"x*sin(x)","x_range":[0,10],"y_range":[-10,10],"frames":30,"fps":12}
```

The LIATE rule is your guide to picking the right fulcrum: put algebraic functions on the left (to differentiate) and trig/exponential on the right (to integrate).
```

---

## ATOM 3: WORKED_EXAMPLE

**File:**
