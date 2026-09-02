---
# Alternative body for root-finding.intuition, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: root-finding.intuition.assured
concept_id: root-finding
atom_type: intuition
bloom_level: 2
difficulty: 0.1
exam_ids: ["*"]
variant_of: root-finding.intuition
for_stance: assured
---

## The condition hiding inside "quadratic convergence"

Quadratic convergence is not a property of Newton-Raphson in general — it holds near a *simple* root, with $f'$ bounded away from $0$ there, once $x_0$ starts close enough. Drop any one of those and the guarantee disappears, even though the update formula never changes.

A root of multiplicity $2$ is the case that looks fine and is not: $f(x)=(x-1)^2$ gives $x_{n+1}=x_n-\dfrac{(x_n-1)^2}{2(x_n-1)}=\dfrac{x_n+1}{2}$, which still converges to $x=1$ — nothing errors out, nothing oscillates — but the order has silently dropped to linear, halving the error each step instead of squaring it. Checking $f'(x^*)\neq0$ before trusting "a couple of iterations should do it" is what catches this before it costs marks.
