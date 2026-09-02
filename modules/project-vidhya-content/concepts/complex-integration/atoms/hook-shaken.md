---
# Alternative body for complex-integration.hook, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling.
id: complex-integration.hook.shaken
concept_id: complex-integration
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: complex-integration.hook
for_stance: shaken
---

Integrate $f(z)=z$ from $0$ to $1+i$ along the straight segment: the antiderivative $z^2/2$ gives $\frac{(1+i)^2}{2}=i$. Take the bent path through $1$ instead — same endpoints, same answer: $i$. Two roads, one number: $z$ is analytic on the whole region between them. Put a singularity between the paths instead, and the two integrals can disagree.
