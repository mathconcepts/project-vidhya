---
id: sets-relations.visual-analogy
concept_id: sets-relations
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.2
exam_ids: ["*"]
modality: visual
---

Picture the equivalence classes of "same remainder mod $3$" on $\{1,\dots,6\}$ as three bars, one per class, height equal to how many elements land in it. All three bars stand at height $2$ — an even, exact split, because $6$ divides evenly by $3$.

Change the set to $\{1,\dots,7\}$ and the bars would read $3,2,2$: the classes stay disjoint and still cover everything, but no longer split evenly. That unevenness is normal — the guarantee from the three equivalence-relation axioms is only that the bars are disjoint and complete, never that they're equal height.

```gif-scene
{"type": "discrete-bars", "values": [2, 2, 2], "labels": ["[1]", "[2]", "[3]"]}
```
