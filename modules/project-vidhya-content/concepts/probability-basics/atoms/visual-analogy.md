---
id: probability-basics.visual-analogy
concept_id: probability-basics
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.2
exam_ids: ["*"]
modality: visual
---

Three numbers from the same disease-test story, side by side: the prior ($P(D)=0.01$, how rare the disease is before any test), the likelihood ($P(\text{pos}\mid D)=0.99$, how good the test is at catching real cases), and the posterior ($P(D\mid\text{pos})\approx0.167$, what you actually learn after a positive result). Watching them as bars makes the surprising part visible: the posterior bar doesn't jump anywhere near the likelihood bar's height — it lands between the tiny prior and the confident-sounding likelihood, dragged down by how many healthy people the test still flags by accident. Bayes' theorem is the arithmetic that pulls that middle value out of the other two.

```gif-scene
{"type":"discrete-bars","values":[0.01,0.99,0.1667],"labels":["prior P(D)","likelihood P(pos|D)","posterior P(D|pos)"]}
```
