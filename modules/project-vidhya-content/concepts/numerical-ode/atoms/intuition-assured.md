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
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
variant_of: numerical-ode.intuition
for_stance: assured
---

## Two separate questions: how accurate, and does it survive at all

Euler's global error is $O(h)$ — that governs accuracy once the method is already behaving. Stability is a prior, independent question: for the linear test case $y'=\lambda y$, Euler stays bounded only while $|1+h\lambda|<1$, i.e. $h<2/|\lambda|$ for real negative $\lambda$.

Choosing $h$ from an accuracy target alone, without checking that threshold, is the common failure here. $y'=-100y,\,y(0)=1$ decays smoothly to $0$; Euler with $h=0.1$ instead amplifies by $1+0.1(-100)=-9$ each step, alternating sign and growing without bound — not because the accuracy order was wrong, but because the stability threshold $h<0.02$ was never checked.
