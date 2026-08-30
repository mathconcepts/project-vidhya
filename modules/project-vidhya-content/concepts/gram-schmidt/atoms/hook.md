---
id: gram-schmidt.hook
concept_id: gram-schmidt
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
---

Three vectors can span exactly the space you want and still be miserable to compute with, leaning against one another at odd angles so that every calculation drags in a system of simultaneous equations. Gram-Schmidt straightens them out: take each vector in turn, subtract off its shadow on everything already fixed, normalise, repeat. Same span, right angles throughout.
