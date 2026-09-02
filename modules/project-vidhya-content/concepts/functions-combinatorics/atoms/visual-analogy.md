---
id: functions-combinatorics.visual-analogy
concept_id: functions-combinatorics
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.2
exam_ids: ["*"]
modality: visual
---

Picture $\binom{5}{k}$ for $k=0$ through $5$ as six bars in a row: $1,5,10,10,5,1$. The shape is symmetric — $\binom{5}{k}=\binom{5}{5-k}$ — and peaks in the middle, at $k=2$ and $k=3$ tied.

That symmetry is a free check: if a computed row of $\binom{n}{k}$ values isn't a mirror image of itself, an arithmetic slip happened somewhere. The peak location also answers "which $k$ maximizes $\binom{n}{k}$" without computing every value — it's always at $k=\lfloor n/2\rfloor$.

```gif-scene
{"type": "discrete-bars", "values": [1, 5, 10, 10, 5, 1], "labels": ["k=0", "k=1", "k=2", "k=3", "k=4", "k=5"]}
```
