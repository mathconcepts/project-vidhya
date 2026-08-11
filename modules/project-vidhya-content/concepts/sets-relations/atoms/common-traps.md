---
id: sets-relations.common-traps
concept_id: sets-relations
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
---

- **Confusing antisymmetry with "not symmetric"**: Antisymmetric does NOT mean "not symmetric." A relation can be both symmetric and antisymmetric (e.g., the identity relation). Antisymmetry says: "if $(a,b)$ and $(b,a)$ are both in $R$, then $a=b$." **Test**: The divisibility relation $x|y$ on positive integers is antisymmetric but NOT symmetric.
- **Assuming reflexivity without checking all elements**: Students often verify reflexivity on one or two examples and generalize. Always check that $(a, a) \in R$ for **every** $a$ in the set, not just a few. Similarly for other properties.
- **Forgetting that $(x,x)$ pairs matter in symmetric relations**: When counting pairs in a symmetric relation, students often forget that diagonal pairs $(x,x)$ contribute 1 to the count (not 2, unlike off-diagonal symmetric pairs which come in pairs).
