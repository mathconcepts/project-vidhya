---
id: boolean-algebra.visual-analogy
concept_id: boolean-algebra
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.2
exam_ids: ["*"]
modality: visual
---

Picture $F$'s entire truth table as eight bars, one per row $ABC=000$ through $111$: heights $0,1,0,1,0,1,1,1$. The last four rows ($100$ through $111$) are mostly tall — three of those four stand up, missing only $100$.

That visual cluster is the "group by $C=1$" and "group by $AB=11$" story from the K-map, seen directly in the raw table: the tall bars aren't scattered randomly, they cluster wherever $C=1$ or wherever $A=B=1$, which is exactly why $F$ collapses to $C+AB$ instead of needing five separate terms.

```gif-scene
{"type": "discrete-bars", "values": [0, 1, 0, 1, 0, 1, 1, 1], "labels": ["000", "001", "010", "011", "100", "101", "110", "111"]}
```
