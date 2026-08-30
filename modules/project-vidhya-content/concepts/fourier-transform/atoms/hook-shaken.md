---
# Alternative body for fourier-transform.hook, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: fourier-transform.hook.shaken
concept_id: fourier-transform
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: fourier-transform.hook
for_stance: shaken
---

A clap decays like $e^{-t}$ for $t>0$, and is $0$ before. Its transform is

$$F(\omega)=\frac{1}{1+i\omega}$$

At $\omega=0$ this is just $1$: the total loudness, averaged over all time. As $|\omega|$ grows, $|F(\omega)|$ shrinks toward $0$ — a clap this short carries almost nothing at very high frequency.
