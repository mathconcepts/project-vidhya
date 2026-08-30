---
# Alternative body for fourier-series.hook, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: fourier-series.hook.shaken
concept_id: fourier-series
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: fourier-series.hook
for_stance: shaken
---

A square wave has sharp corners. Add just three sine terms —

$$\sin x+\tfrac13\sin 3x+\tfrac15\sin 5x$$

— and the sum already has a flat top and a jump, not three separate wiggles. No single term looks like the square wave; the running sum does. Keep one thing: more terms sharpen the corner; the flat middle was already there.
