---
id: series.visual_analogy
concept_id: series
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.15
exam_ids: ["*"]
modality: visual
---

Six bars, one per partial sum of $\sum \frac1{2^n}$: $S_1=0.5$, $S_2=0.75$, $S_3=0.875$, $S_4=0.9375$, $S_5=0.96875$, $S_6=0.984375$. Every bar is taller than the last, but the height gained per step keeps shrinking — the climb visibly flattens out as it approaches the ceiling at $1$, never quite reaching it in six steps and never crossing it in any number of steps. That flattening-toward-a-ceiling shape is what convergence looks like for a series of positive terms: not a running total that stalls outright, but one whose growth rate decays fast enough to stay trapped under a fixed bound forever.

```gif-scene
{"type":"discrete-bars","values":[0.5,0.75,0.875,0.9375,0.96875,0.984375],"labels":["S1","S2","S3","S4","S5","S6"]}
```
