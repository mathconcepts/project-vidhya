---
id: counting-principles.visual-analogy
concept_id: counting-principles
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.2
exam_ids: ["*"]
modality: visual
---

Line up the combination counts $C(6,0), C(6,1), \dots, C(6,6)$ as bars and a shape appears: small at the ends, tallest in the middle, and perfectly symmetric — $C(6,k) = C(6,6-k)$ always, because choosing $k$ items to *include* is the same count as choosing $6-k$ items to *exclude*. The peak at $k=3$ is not a coincidence of this particular $n$; the middle of any row is where there's the most freedom to trade included items for excluded ones. Watching the bars grow and shrink is watching the symmetry identity happen, not just stating it.

```gif-scene
{"type":"discrete-bars","values":[1,6,15,20,15,6,1],"labels":["k=0","k=1","k=2","k=3","k=4","k=5","k=6"]}
```
