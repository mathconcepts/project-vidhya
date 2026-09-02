---
# Alternative body for numerical-ode.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: numerical-ode.hook.assured
concept_id: numerical-ode
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: numerical-ode.hook
for_stance: assured
---

"Higher order" describes *local* accuracy per step, not automatic safety. Explicit Euler on $y'=-2y$ with a step size too large relative to the coefficient doesn't just lose accuracy — the numerical solution oscillates and grows without bound, a stability failure entirely separate from truncation error. RK4's larger stability region delays this, but does not remove it: every explicit method has a step-size threshold past which the discrete solution diverges even though the true solution decays smoothly to zero.
