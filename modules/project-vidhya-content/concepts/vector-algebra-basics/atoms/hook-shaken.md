---
# Alternative body for vector-algebra-basics.hook, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: vector-algebra-basics.hook.shaken
concept_id: vector-algebra-basics
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: vector-algebra-basics.hook
for_stance: shaken
---

Two forces pull one ring: 5 N east, 5 N at 60° north of east. Step one: draw both as arrows from the same point. Step two: complete the parallelogram — the diagonal from that shared point is the net force. Step three: compute it. $|\vec F|=\sqrt{5^2+5^2+2(5)(5)\cos60^\circ}=\sqrt{25+25+25}=\sqrt{75}\approx8.66$ N. Check: this is less than $10$ N (same-direction sum) and more than $5$ N (either force alone) — it must land between those two bounds, and it does.
