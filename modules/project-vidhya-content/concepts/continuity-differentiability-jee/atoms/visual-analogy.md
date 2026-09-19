---
id: continuity-differentiability-jee.visual-analogy
concept_id: continuity-differentiability-jee
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
scaffold_fade: true
---

# The Hairpin Bend Analogy

Picture a road drawn as a graph: distance travelled on the horizontal axis, the road's direction on the vertical axis. A gentle curve is continuous *and* differentiable — the direction changes smoothly, and a driver never feels a sudden jolt in steering angle. Now picture a hairpin bend where the road doubles back on itself at a sharp point, like the tip of a V. The road itself is still one unbroken strip of tarmac — no gap, no teleporting — so it is continuous. But right at the tip, "which direction is the road pointing?" has two different answers depending on whether you look at the approach or the exit. That tip is exactly a point where a function is continuous but not differentiable.

The graph of $f(x)=|x-2|$ on the card is that hairpin bend in exact miniature: one unbroken V-shaped curve, continuous everywhere, with its one sharp point sitting precisely at $x=2$.

```gif-scene
{"type":"function-trace","expression":"abs(x-2)","x_range":[-1,5],"y_range":[-0.5,3.5],"frames":30,"fps":12}
```
