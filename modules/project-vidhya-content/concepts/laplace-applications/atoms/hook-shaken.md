---
# Alternative body for laplace-applications.hook, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: laplace-applications.hook.shaken
concept_id: laplace-applications
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: laplace-applications.hook
for_stance: shaken
---

$y'+3y=0$, $y(0)=2$. Transform once: $sY-2+3Y=0$, so $Y(s)=\dfrac{2}{s+3}$. Read the table:

$$y(t)=2e^{-3t}$$

Three algebra lines replaced solving the differential equation directly — no integrating factor, no guessing a form first.
