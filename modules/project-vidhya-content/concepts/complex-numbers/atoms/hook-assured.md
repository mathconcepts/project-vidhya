---
# Alternative body for complex-numbers.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: complex-numbers.hook.assured
concept_id: complex-numbers
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: complex-numbers.hook
for_stance: assured
---

The real content behind $i=\sqrt{-1}$ isn't "a number whose square is negative exists" — plenty of algebraic extensions manage that. It's that $\mathbb{C}\cong\mathbb{R}^2$ with multiplication built so multiplying by any $z=re^{i\theta}$ turns by $\theta$ and stretches by $r$, together, in one step. That's why $i^2=-1$: multiplying by $i$ rotates $90°$ twice, landing at $180°$, which is exactly multiplication by $-1$ — a geometric fact wearing an algebraic disguise, not a postulate bolted on.
