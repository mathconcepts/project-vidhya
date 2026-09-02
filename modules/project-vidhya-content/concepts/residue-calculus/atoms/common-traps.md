---
id: residue-calculus.common-traps
concept_id: residue-calculus
atom_type: common_traps
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
---

**Trap 1 — Forgetting the $2\pi i$ factor.** The Residue Theorem includes a factor of $2\pi i$. Computing the sum of residues and stopping there gives an answer off by exactly that factor.

**Trap 2 — Wrong formula for the pole order.** Simple pole: $\lim_{z\to z_0}(z-z_0)f(z)$. Order $n>1$: the derivative formula. Applying the simple-pole limit to $e^z/z^2$ gives $\lim_{z\to0}e^z/z$, which doesn't exist — a strong signal the order was misjudged, not that the residue is undefined.

**Trap 3 — Including poles outside the contour.** A pole outside $C$ contributes nothing. Factoring the full denominator and summing every residue found, without checking each one is actually inside $C$, is a common source of an inflated answer.
