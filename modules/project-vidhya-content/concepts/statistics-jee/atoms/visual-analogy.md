---
id: statistics-jee.visual-analogy
concept_id: statistics-jee
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
modality: visual
---

Think of every year's deviation from the mean as a weight hung on a balance scale that is pivoted exactly at the mean. The scale ALWAYS balances perfectly — the weights on the "above the mean" side and the "below the mean" side cancel exactly, which is just another way of saying $\sum(x-\bar x)=0$ always. But a perfectly balanced scale tells you nothing about how HEAVY the individual weights are, only that they cancel.

The bars on this card are City B's five yearly deviations from its own mean of $100$ mm: $0,-20,20,-10,10$. Add them and you get exactly $0$ — the scale balances, as it must, for any dataset. But the actual weights hanging on it are large: $20$ mm, $10$ mm swings either side. That is precisely why "the deviations sum to zero" is a dead end for measuring spread, and why every real measure of spread — mean deviation, variance, standard deviation — first destroys the sign (by absolute value, or by squaring) before averaging, so the genuinely large weights stop cancelling the genuinely small ones.

```gif-scene
{"type":"discrete-bars","values":[0,-20,20,-10,10],"labels":["Yr1","Yr2","Yr3","Yr4","Yr5"],"title":"City B: yearly deviation from its own mean (100mm)","frames":1,"fps":1}
```
