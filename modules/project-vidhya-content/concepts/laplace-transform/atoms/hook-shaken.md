---
# Alternative body for laplace-transform.hook, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: laplace-transform.hook.shaken
concept_id: laplace-transform
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: laplace-transform.hook
for_stance: shaken
---

Take $f(t)=e^{-2t}$, a decay. Its transform is

$$F(s)=\frac{1}{s+2}$$

One pole, at $s=-2$ — the same $-2$ already sitting in the exponent. The transform didn't add information; it relocated the decay rate to a single number.
