---
id: differentiability.visual_analogy
concept_id: differentiability
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.30
exam_ids: ["*"]
scaffold_fade: true
---

# Visual Analogy: The Mountain Road vs. The Lightning Bolt

**Imagine two mountain paths up a hillside:**

The **smooth winding road** curves gently — at any point, you can clearly see the direction you're heading. This is like a differentiable function: no matter where you look, there's a well-defined tangent line (slope).

The **lightning bolt path**, however, has a sharp zigzag at one point where the path suddenly changes direction abruptly. At that exact corner, you cannot draw a single tangent line — the direction before the corner and after the corner are different. This is like a non-differentiable point.

The absolute value function $y = |x|$ is exactly this: smooth everywhere except at $x = 0$, where the path makes a sharp V-shaped turn. The left and right slopes don't match, so the derivative doesn't exist there.

Differentiability captures this idea: **a function is differentiable where its graph is smooth, with no sharp corners or sudden changes in direction**.

```gif-scene
{"type":"function-trace","expression":"abs(x)","x_range":[-3,3],"y_range":[0,3.5],"frames":30,"fps":12}
```

---