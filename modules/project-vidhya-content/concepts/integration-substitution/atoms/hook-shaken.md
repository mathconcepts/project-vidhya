---
# Alternative body for integration-substitution.hook, served when the
# learner stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: integration-substitution.hook.shaken
concept_id: integration-substitution
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: integration-substitution.hook
for_stance: shaken
---

$\int 2x\cos(x^2)\,dx$: let $u=x^2$, so $du=2x\,dx$ — exactly the factor sitting outside. The integral becomes $\int\cos u\,du=\sin u+C$. Substitute back: $\sin(x^2)+C$. Check: $\frac{d}{dx}[\sin(x^2)]=\cos(x^2)\cdot2x$. Matches.
