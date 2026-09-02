---
id: interpolation.intuition
concept_id: interpolation
atom_type: intuition
bloom_level: 2
difficulty: 0.1
exam_ids: ["*"]
---

## Exactly one curve fits

Given $n$ points with distinct $x$-values, there is exactly one polynomial of degree at most $n-1$ that passes through all of them — uniqueness comes free from having $n$ conditions and $n$ coefficients to satisfy them.

**Lagrange's form** writes that polynomial directly as a sum of $n$ pieces, one per point: $P(x)=\sum y_iL_i(x)$, where each basis piece $L_i$ is built to equal $1$ at its own node and $0$ at every other — nothing to solve, just evaluate.

**Newton's divided-difference form** builds the same polynomial incrementally instead: start with the first point's value, add a correction term for the second point, another for the third, and so on. Add a new data point later and only one new term is needed — no rebuild from scratch, unlike Lagrange.

**Splines** abandon a single global polynomial altogether, stitching together many low-degree pieces (usually cubics) so that a high-degree fit's tendency to oscillate near the ends of a range — worse the more equally-spaced points you add — never gets the chance to appear.

The polynomial only *matches* the true function at the given nodes; between them, and especially outside their span, it is a plausible guess with no guarantee attached.
