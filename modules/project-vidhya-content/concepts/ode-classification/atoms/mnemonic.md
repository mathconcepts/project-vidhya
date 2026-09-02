---
id: ode-classification.mnemonic
concept_id: ode-classification
atom_type: mnemonic
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
modality: mnemonic
---

**"O-D-L, in that order":** Order first (which derivative is highest — always answerable), Degree second (its power — only after clearing roots/fractions/trig, sometimes undefined), Linearity last (every term to the first power, no products, no wrapping — a yes/no that can fail from any term, not just the highest one).

**Worked micro-example:** classify $(y'')^3 + y' = 0$.
- **O**rder: highest derivative is $y''$, so order $=2$.
- **D**egree: already polynomial in derivatives (no roots, no trig); the highest-order derivative, $y''$, is raised to the power $3$, so degree $=3$.
- **L**inearity: a power of $3$ on $y''$ alone already breaks linearity — non-linear.

**Sanity-check reflex:** after classifying, re-scan the equation term by term and ask "does THIS term alone break linearity?" A single product or a single non-unit power anywhere is enough to flip the verdict, no matter how clean the rest of the equation looks.
