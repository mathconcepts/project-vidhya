---
# Alternative body for numerical-integration.hook, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: numerical-integration.hook.shaken
concept_id: numerical-integration
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: numerical-integration.hook
for_stance: shaken
---

$\int_0^1 e^{-x^2}\,dx$ has no elementary antiderivative — none of the usual functions integrate to it. A calculator still hands back $\approx0.7468$ for it. Numerical integration gets you that number without ever finding an antiderivative, by adding up thin strips of area instead.
