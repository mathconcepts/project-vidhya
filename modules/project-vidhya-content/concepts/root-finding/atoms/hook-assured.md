---
# Alternative body for root-finding.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: root-finding.hook.assured
concept_id: root-finding
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: root-finding.hook
for_stance: assured
---

Newton-Raphson's quadratic convergence assumes $f'(x_n)$ stays away from zero and the root is simple. A double root — $f(x)=(x-1)^2$, say — quietly breaks the second assumption: the iteration $x_{n+1}=(x_n+1)/2$ still converges to $x=1$, so nothing looks wrong, but the order silently drops to linear, and the digit-doubling you were counting on to bound your iteration count never shows up.
