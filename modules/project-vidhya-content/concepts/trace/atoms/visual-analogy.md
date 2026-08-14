---
id: trace.visual_analogy
concept_id: trace
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.2
modality: visual
exam_ids: ["*"]
---

Think of trace like **pooling the "weight" of a transformation onto a single dial**. When you apply a matrix to vectors, each component (x, y, z, ...) gets transformed independently along the diagonal, and sheared or rotated off-diagonal. The trace sums up only the "weight" on the main diagonal—it's as if you're ignoring all the cross-talk and just asking: "By how much does this transformation expand or shrink the volume of a tiny box, overall?" 

Two different matrices $A$ and $B$ might give a unit box a completely different shape, but if you *compose* them in either order—$AB$ or $BA$—you're pumping the same total "volume expansion" through in a chain, so $\text{tr}(AB) = \text{tr}(BA)$. The eigenvalues are the *true* expansion factors along the natural axes of the matrix; the trace is their sum, the *invariant total*—it doesn't depend on which coordinate system you write them down in.

```gif-scene
{"type":"function-trace","expression":"sqrt(x*x + 4*x*x)","x_range":[-2,2],"y_range":[0,10],"frames":30,"fps":12}
```
