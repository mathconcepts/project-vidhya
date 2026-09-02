---
# Alternative body for limits.intuition, served when the learner stance is
# `shaken`. Concrete-first, smallest true step, explicit check.
id: limits.intuition.shaken
concept_id: limits
atom_type: intuition
bloom_level: 2
difficulty: 0.1
exam_ids: ["*"]
variant_of: limits.intuition
for_stance: shaken
---

Trace the graph of $f(x)=\dfrac{x^2-1}{x-1}$ with a pencil as $x$ slides toward $1$ from the left, then from the right. Both sides land the pencil at height $2$ — even though $f(1)$ itself is undefined (division by zero). That is a limit: what the graph is doing near a point, not what happens exactly at it.

Compare a step function: left side lands at one height, right side lands at a different height. No single number describes where the pencil is heading, so no limit exists there. Check both sides separately, every time — same height means the limit exists; different heights means it doesn't.
