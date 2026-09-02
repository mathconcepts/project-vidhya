---
id: propositional-logic.visual-analogy
concept_id: propositional-logic
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.2
exam_ids: ["*"]
modality: visual
---

Picture $P\to Q$ not as a sentence but as a bar for each of its four possible inputs — one bar per combination of $P$ and $Q$, height $1$ if the implication comes out true and $0$ if false. Three bars stand tall; only the $P{=}T,Q{=}F$ combination drops to zero.

That shape is worth recognizing on sight: $P\to Q$ is false in exactly one of its four rows. Every connective has its own signature shape — $P\land Q$ has exactly one bar up, $P\lor Q$ has exactly one bar down, $P\oplus Q$ alternates, two up and two down. Spotting the shape is faster than re-deriving the table each time.

```gif-scene
{"type": "discrete-bars", "values": [1, 0, 1, 1], "labels": ["TT", "TF", "FT", "FF"]}
```
