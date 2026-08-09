---
id: sets-relations.formal-definition
concept_id: sets-relations
atom_type: formal_definition
bloom_level: 2
difficulty: 0.24
exam_ids: ["*"]
---

**Set**: A well-defined collection of distinct objects. Notation: $S = \{1, 2, 3\}$ (roster form) or $S = \{x : x \text{ is even and } x < 10\}$ (set-builder).

**Relation**: A subset $R$ of the Cartesian product $A \times B$ (for a relation from set $A$ to set $B$). For sets $A$ and $B$, we write $(a, b) \in R$ if $a$ is related to $b$.

**Properties of Relations** (on a set $A$ to itself):
- **Reflexive**: $(a, a) \in R$ for all $a \in A$.
- **Symmetric**: If $(a, b) \in R$, then $(b, a) \in R$.
- **Antisymmetric**: If $(a, b) \in R$ and $(b, a) \in R$, then $a = b$.
- **Transitive**: If $(a, b) \in R$ and $(b, c) \in R$, then $(a, c) \in R$.

**Equivalence Relation**: A relation that is reflexive, symmetric, and transitive. It partitions the set into equivalence classes.
