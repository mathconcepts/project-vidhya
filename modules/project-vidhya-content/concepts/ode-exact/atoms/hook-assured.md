---
# Alternative body for ode-exact.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: ode-exact.hook.assured
concept_id: ode-exact
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: ode-exact.hook
for_stance: assured
---

Exactness is a level-curve claim, holding exactly when $\partial M/\partial y=\partial N/\partial x$. When that fails, an integrating factor rescues the equation only under a narrower condition — $(M_y-N_x)/N$ a function of $x$ alone, or $(N_x-M_y)/M$ a function of $y$ alone — not automatically.
