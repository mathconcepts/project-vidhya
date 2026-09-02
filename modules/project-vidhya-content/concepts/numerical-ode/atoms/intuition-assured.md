---
# Alternative body for numerical-ode.intuition, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: numerical-ode.intuition.assured
concept_id: numerical-ode
atom_type: intuition
bloom_level: 2
difficulty: 0.1
exam_ids: ["*"]
variant_of: numerical-ode.intuition
for_stance: assured
---

## Local order vs. global order — GATE conflates them on purpose

A question asking "which order is Euler's method?" is ambiguous unless you fix which error it means. The *local* truncation error per step is $O(h^2)$; accumulated over the $O(1/h)$ steps needed to reach a fixed endpoint, the *global* error is one power of $h$ worse, $O(h)$ — the number GATE means when it calls Euler "first-order."

The same shift applies to RK4: local error $O(h^5)$, global error $O(h^4)$. Whenever a question states a method's "order" without qualifying local vs. global, assume global — it's the one that determines how many correct decimal places a given step count actually buys.
