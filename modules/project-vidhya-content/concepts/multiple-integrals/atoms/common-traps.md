---
id: multiple-integrals.common_traps
concept_id: multiple-integrals
atom_type: common_traps
bloom_level: 3
difficulty: 0.45
exam_ids: ["*"]
tested_by_atom: multiple-integrals.micro-exercise
---

**Trap 1 — Rectangle-style constant bounds on a non-rectangular region.** Integrating $y$ from $0$ to $2$ when the region's true upper bound is a function of $x$ — like $y=x$ — silently integrates over the wrong shape, even though every other symbol looks correctly placed.

**Trap 2 — Swapping order without re-deriving the bounds.** Only the INTEGRAND swaps freely on a rectangle; on a general region, the bounds themselves must be re-derived from the region's actual shape, not copied across unchanged.

**Trap 3 — Forgetting the Jacobian in polar coordinates.** $dA=r\,dr\,d\theta$, not $dr\,d\theta$ — dropping the factor of $r$ under- or over-counts area depending on how far the region sits from the origin.
