---
id: graph-basics.visual-analogy
concept_id: graph-basics
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.20
exam_ids: ["*"]
modality: visual
---

Picture the five degrees from the worked graph as a row of bars: $3,3,3,2,1$ for $A,B,C,D,E$. Add the bar heights and you get $12$ — but that total isn't the number of dots or the number of lines directly; it's exactly twice the edge count, because every line drawn touched two bars at once, one at each end.

Any graph's degree sequence is a bar chart like this one, and the handshaking lemma is just the statement that the bars always sum to an even number equal to $2|E|$, whatever shape the graph takes.

```gif-scene
{"type": "discrete-bars", "values": [3, 3, 3, 2, 1], "labels": ["A", "B", "C", "D", "E"], "title": "Degree sequence: sums to 12 = 2|E|"}
```
