---
# Alternative body for z-transform.hook, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: z-transform.hook.shaken
concept_id: z-transform
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: z-transform.hook
for_stance: shaken
---

$y[n]-0.5y[n-1]=1$, $y[-1]=0$. March it by hand: $y[0]=1$, $y[1]=1.5$, $y[2]=1.75$ — one number at a time, forever. Transform once and $Y(z)$ solves in a single algebraic line instead.
