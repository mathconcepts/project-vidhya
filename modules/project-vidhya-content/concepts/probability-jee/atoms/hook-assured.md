---
id: probability-jee.hook-assured
concept_id: probability-jee
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: probability-jee.hook
for_stance: assured
---

"Mutually exclusive" and "independent" sound like cousins; they are closer to opposites. Two mutually exclusive events with nonzero probability can NEVER be independent — if $A$ happens, $P(B)$ collapses to exactly zero, which is the strongest possible dependence, not none. Take $P(A)=0.3,P(B)=0.4$, mutually exclusive: $P(A\cap B)=0$ by definition, but independence would need $P(A\cap B)=P(A)P(B)=0.12\ne0$. The equality fails, so they are dependent — heavily. A machine producing a "Grade-A" item and that same item being "Grade-B" are mutually exclusive; knowing one happened tells you everything about the other, the opposite of independence's "tells you nothing."
