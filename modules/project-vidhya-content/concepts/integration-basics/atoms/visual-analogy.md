---
id: integration-basics.visual_analogy
concept_id: integration-basics
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.30
exam_ids: ["*"]
scaffold_fade: true
---

# Integration as Retracing Your Steps

Imagine you're tracking an object's velocity over time. **Differentiation** is computing velocity from position (rate of change). **Integration** is the reverse: reconstructing the path from velocity data alone.

If I tell you "at each instant your speed was exactly $x$ meters per second," you can work backwards to ask "how far have I traveled?" The answer is the integral $\int x \, dx = \frac{x^2}{2} + C$. The position depends on where you started (the constant $C$).

The visual below shows the antiderivative $F(x) = \frac{x^2}{2}$ — the shape you get when integrating $f(x) = x$. Notice how it curves upward: integration "accumulates" information. Each point on this curve represents the total area swept out under the line $y = x$ up to that $x$-value. This parabolic curve is the source of all exam problems about areas, volumes, and accumulation.

```gif-scene
{"type":"function-trace","expression":"x^2/2","x_range":[-4,4],"y_range":[-0.5,8],"frames":30,"fps":12}
```
```

## ATOM 3: Worked Example

**File path:**
