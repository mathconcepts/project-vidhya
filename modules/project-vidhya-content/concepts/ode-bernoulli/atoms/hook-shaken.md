---
# Alternative body for ode-bernoulli.hook, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: ode-bernoulli.hook.shaken
concept_id: ode-bernoulli
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: ode-bernoulli.hook
for_stance: shaken
---

Take $\dfrac{dy}{dx} - y = xy^2$. That $y^2$ on the right is the whole problem — plain linear tools have nothing to grab onto. Swap in $v = y^{-1}$ and the same equation turns linear.
