---
# Alternative body for interpolation.hook, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: interpolation.hook.shaken
concept_id: interpolation
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: interpolation.hook
for_stance: shaken
---

You know $f(0)=1$ and $f(1)=3$ — nothing else about $f$. Draw a straight line between the two points anyway: at $x=0.5$ it reads $f(0.5)\approx1+0.5(3-1)=2$. That number — read off a line you invented, not derived from $f$ — is the whole trade interpolation makes: give up exactness, get something you can actually compute.
