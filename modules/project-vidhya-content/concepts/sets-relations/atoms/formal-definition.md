---
id: sets-relations.formal-definition
concept_id: sets-relations
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

A relation $R$ on a set $S$ is an **equivalence relation** if it is reflexive ($aRa$ for all $a$), symmetric ($aRb \Rightarrow bRa$), and transitive ($aRb \land bRc \Rightarrow aRc$). Every equivalence relation partitions $S$ into disjoint **equivalence classes** $[a] = \{x \in S : xRa\}$, and every partition of $S$ defines an equivalence relation back.

$R$ is a **partial order** if it is reflexive, **antisymmetric** ($aRb \land bRa \Rightarrow a=b$), and transitive; the pair $(S,R)$ is then a **poset**.

**Method selector.** Check symmetric first when a relation is offered without a label: if $aRb$ always implies $bRa$, test transitivity next for equivalence; if instead $aRb$ and $bRa$ can only coexist when $a=b$, it's a candidate partial order and antisymmetry is the property to verify. Assuming reflexive+transitive alone settles the type is the error — that pair alone is only a preorder and commits to neither structure.
