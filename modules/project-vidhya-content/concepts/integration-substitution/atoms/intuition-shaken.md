---
# Alternative body for integration-substitution.intuition, served when the
# learner stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: integration-substitution.intuition.shaken
concept_id: integration-substitution
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
variant_of: integration-substitution.intuition
for_stance: shaken
---

Look at $\int 2x\cos(x^2)\,dx$. The inside of the cosine is $x^2$; the derivative of $x^2$ is $2x$ — sitting right there as a separate factor. Name the inner function $u=x^2$, then $du=2x\,dx$.

Rewrite the whole integral in terms of $u$ only: $\int \cos u\,du$.

Integrate the simple trig form: $\int \cos u\,du=\sin u+C$.

Substitute back $u=x^2$: $\sin(x^2)+C$.

Check by differentiating: $\dfrac{d}{dx}\left[\sin(x^2)\right]=\cos(x^2)\cdot2x=2x\cos(x^2)$. Matches.

The recipe, always in this order: name $u$, find $du$, rewrite everything in terms of $u$, integrate, substitute back.

For a radical like $\sqrt{1-x^2}$, the same idea extends with a trig substitution — $x=\sin\theta$ turns $\sqrt{1-x^2}$ into $\cos\theta$, dissolving the square root into ordinary trig.

The one thing to spot before anything else: does the derivative of some piece inside the expression already sit outside it, waiting to be $du$?
