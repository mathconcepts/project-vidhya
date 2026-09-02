---
id: boolean-algebra.hook
concept_id: boolean-algebra
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
---

A circuit computes $F = A'B'C + A'BC + AB'C + ABC' + ABC$ using five product terms wired into one big OR gate. Five gates just to combine them. Could the same truth table be built with far fewer?

Check what the five terms have in common: three of them share $C=1$, two of them share $A=B=1$. If those overlaps aren't a coincidence, the circuit shrinks a lot.
