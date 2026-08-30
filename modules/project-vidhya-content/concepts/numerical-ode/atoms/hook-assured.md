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
difficulty: 0
exam_ids: ["*"]
variant_of: numerical-ode.hook
for_stance: assured
---

Euler's accuracy bound says nothing about stability — that's a separate condition: for $y'=\lambda y$, the iterates stay bounded only while $|1+h\lambda|<1$, i.e. $h<2/|\lambda|$ for real negative $\lambda$. Take $y'=-100y,\,y(0)=1$: the true solution decays smoothly to $0$, yet Euler with $h=0.1$ amplifies by $1-100(0.1)=-9$ each step — sign-alternating and growing, even though nothing about the equation itself looks unstable.
