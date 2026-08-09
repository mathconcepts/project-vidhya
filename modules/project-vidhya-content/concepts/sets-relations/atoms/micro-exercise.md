---
id: sets-relations.micro-exercise
concept_id: sets-relations
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
estimated_minutes: 2
---

Let $R$ be a relation on set $\{1, 2, 3\}$ defined by $xRy$ if $x + y$ is even. Which of the following is true about $R$?

- **(A)** $R$ is reflexive but not symmetric
- **(B)** $R$ is symmetric but not transitive
- **(C)** $R$ is both reflexive and transitive
- **(D)** $R$ is neither reflexive nor symmetric

<details>
<summary>Answer</summary>

**C**. Let's construct the relation: $(x, y) \in R$ iff $x + y$ is even. This happens iff $x$ and $y$ have the same parity (both even or both odd). On $\{1, 2, 3\}$: Pairs where $x + y$ is even: $(1,1)$ (1+1=2), $(1,3)$ (1+3=4), $(2,2)$ (2+2=4), $(3,1)$ (3+1=4), $(3,3)$ (3+3=6). So $R = \{(1,1), (1,3), (2,2), (3,1), (3,3)\}$. Check reflexivity: $(1,1) ✓, (2,2) ✓, (3,3) ✓$ all in $R$, so reflexive ✓. Check symmetry: $(1,3) \in R$ and $(3,1) \in R$ ✓; all pairs satisfy symmetry. Check transitivity: If $(a,b) \in R$ and $(b,c) \in R$, then $a+b$ and $b+c$ are both even. This means $a$ and $b$ have the same parity, and $b$ and $c$ have the same parity, so $a$ and $c$ have the same parity, making $a+c$ even. Thus $(a,c) \in R$ ✓. Therefore $R$ is reflexive and transitive (also symmetric, making it an equivalence relation).

</details>
