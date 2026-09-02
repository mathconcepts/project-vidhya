---
id: discrete-distributions.visual-analogy
concept_id: discrete-distributions
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.2
exam_ids: ["*"]
modality: visual
---

Six bars, one per possible count of successes out of 5 trials at $p=0.3$: the tallest sits at $k=1$, not $k=2$ or $k=3$ — because with $p<0.5$, the most likely outcome tilts toward fewer successes, not the middle. The bars' heights sum to exactly 1, and the whole shape shifts right as $p$ grows past $0.5$ and left as it shrinks further below it. Watching where the peak sits is a faster sanity check than computing every term: a peak far from $np$ signals an arithmetic slip somewhere in the six terms.

```gif-scene
{"type":"discrete-bars","values":[0.16807,0.36015,0.3087,0.1323,0.02835,0.00243],"labels":["k=0","k=1","k=2","k=3","k=4","k=5"]}
```
