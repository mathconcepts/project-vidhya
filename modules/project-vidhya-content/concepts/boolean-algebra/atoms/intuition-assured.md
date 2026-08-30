---
# Alternative body for boolean-algebra.intuition, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: boolean-algebra.intuition.assured
concept_id: boolean-algebra
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["gate-ma"]
scaffold_fade: 0
variant_of: boolean-algebra-intuition
for_stance: assured
---

$\{0,1\}$ under AND, OR, complement — three operations, closed under De Morgan's duality: swap $\cdot\leftrightarrow+$ and complement every literal, and any identity produces its dual for free. The distinction worth having automatic: minimizing literal count is not the same task as minimizing term count, and GATE scores the former. A grid makes literal-dropping visual — adjacent cells differ in exactly one variable, so a group spanning $2^k$ cells has dropped exactly $k$ variables from the label:

```
      B'   B
  A' | 0 | 1 |
  A  | 2 | 3 |
```

Read the map as a torus, not a rectangle — edges wrap, so a group can straddle row 0/row-max or column 0/column-max, and missing that wraparound is the single most common way a "simplified" answer isn't:

```
       CD:  00  01  11  10
  AB: 00  |  0 |  1 |  3 |  2 |
      01  |  4 |  5 |  7 |  6 |
      11  | 12 | 13 | 15 | 14 |
      10  |  8 |  9 | 11 | 10 |
```

SOP versus POS is a choice of which value ($1$s or $0$s) you group, not a different algebra — grouping the $0$s and complementing gives POS directly. A function with more $0$s than $1$s is usually faster to minimize that way, and forgetting the option costs time, not correctness.
