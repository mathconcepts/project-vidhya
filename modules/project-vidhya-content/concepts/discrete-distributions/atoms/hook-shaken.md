---
# Alternative body for discrete-distributions.hook, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: discrete-distributions.hook.shaken
concept_id: discrete-distributions
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: discrete-distributions.hook
for_stance: shaken
---

Flip a coin 3 times and count heads: 0, 1, 2, or 3, each with its own probability — $P(2)=\binom{3}{2}(0.5)^3=3/8$. That's binomial. Counting cars arriving in a minute has no fixed number of trials at all — a different distribution, Poisson, fits that instead.
