---
id: recurrence-relations.visual-analogy
concept_id: recurrence-relations
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
modality: visual
---

Picture the sequence $a_n=2^n+3^n$ as six bars, one per $n=0$ through $5$: $2,5,13,35,97,275$. Each bar is roughly $3$ times the one before it once $n$ is a few steps in — the $3^n$ term eventually swamps the $2^n$ term, so the long-run growth rate is set by the **larger** root, not the average of both.

That's a general fact about linear recurrences with distinct real roots: for large $n$, the sequence's growth rate converges to the largest root, however small its coefficient. Reading the ratio of consecutive bars is a fast way to sanity-check which root dominates.

```gif-scene
{"type": "discrete-bars", "values": [2, 5, 13, 35, 97, 275], "labels": ["a0", "a1", "a2", "a3", "a4", "a5"]}
```
