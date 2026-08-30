---
# Alternative body for limits.hook, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: limits.hook.shaken
concept_id: limits
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: limits.hook
for_stance: shaken
---

Feed $x=-0.001$ into $\frac{\sin x}{x}$: about $0.9999998$. Feed $x=0.001$: also about $0.9999998$. Both sides are closing in on the same number, $1$, even though plugging in $x=0$ itself gives $\frac00$ — undefined. What the function is heading toward, from either side, is the limit.
