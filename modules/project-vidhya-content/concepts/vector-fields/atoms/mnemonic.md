---
id: vector-fields.mnemonic
concept_id: vector-fields
atom_type: mnemonic
bloom_level: 2
difficulty: 0.20
exam_ids: ["*"]
modality: mnemonic
---

**"Grad points uphill."** $\nabla\phi$ always points toward increasing $\phi$, perpendicular to the level curve through that point — never along it. If you can picture a hill, the gradient is the direction water would refuse to flow.

**The conservative-field checklist, remembered as "MEP":**

- **M**ixed partials: $\partial Q/\partial x = \partial P/\partial y$?
- **E**xistence of $\phi$ follows only if that check passes.
- **P**otential is found by integrating $P$ in $x$, then matching the $y$-derivative to $Q$.

Worked micro-example: for $\mathbf F=(2xy,\,x^2)$, mixed partials give $2x=2x$ — conservative — and integrating $P=2xy$ in $x$ gives $\phi=x^2y+g(y)$; matching $\partial\phi/\partial y=x^2$ to $Q=x^2$ gives $g'(y)=0$, so $\phi=x^2y$.

**Sanity-check reflex:** after finding any $\phi$, differentiate it back — $\nabla\phi$ must reproduce the original field exactly, both components. If it doesn't, the potential is wrong, not the field.
