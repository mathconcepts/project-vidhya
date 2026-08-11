---
id: counting-principles.common-traps
concept_id: counting-principles
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
---

- **Confusing permutation and combination**: Students often use $P(n,r)$ when they should use $C(n,r)$, or vice versa. The key: if the problem says "arrange," "order," "sequence," or "roles," use permutation; if it says "select," "choose," "committee," or "group," use combination.
- **Forgetting the constraint handling**: When certain objects must be together or must NOT be together, students fail to apply the "treat as one unit" trick, leading to massive overcounting or undercounting.
- **Miscalculating factorial division**: Students write $\frac{8!}{3! \cdot 5!}$ and then compute $8 \times 7 \times 6 / (3 \times 2 \times 1)$ but make arithmetic errors in the final multiplication/division step. Always cancel factors first: $\frac{8 \times 7 \times 6}{6} = 56$.
