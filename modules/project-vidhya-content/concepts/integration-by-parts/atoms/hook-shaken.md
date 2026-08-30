---
# Alternative body for integration-by-parts.hook, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: integration-by-parts.hook.shaken
concept_id: integration-by-parts
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: integration-by-parts.hook
for_stance: shaken
---

$\int xe^x\,dx$: let $u=x$, $dv=e^x\,dx$, so $du=dx$, $v=e^x$. Then $\int xe^x\,dx=xe^x-\int e^x\,dx=xe^x-e^x+C$. Check by differentiating: $\frac{d}{dx}[xe^x-e^x]=e^x+xe^x-e^x=xe^x$. Matches.
