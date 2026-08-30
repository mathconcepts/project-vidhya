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

Look at $\int 3x^2(x^3+1)^4\,dx$. The outer piece is a 5th power wrapped around $x^3+1$; the derivative of $x^3+1$ is $3x^2$ — sitting right there as a separate factor. Name the inner function $u=x^3+1$, then $du=3x^2\,dx$.

Rewrite the whole integral in terms of $u$ only: $\int u^4\,du$.

Integrate the simple power: $\int u^4\,du=\dfrac{u^5}{5}+C$.

Substitute back $u=x^3+1$: $\dfrac{(x^3+1)^5}{5}+C$.

Check by differentiating: $\dfrac{d}{dx}\left[\dfrac{(x^3+1)^5}{5}\right]=\dfrac{5(x^3+1)^4\cdot3x^2}{5}=3x^2(x^3+1)^4$. Matches.

The recipe, always in this order: name $u$, find $du$, rewrite everything in terms of $u$, integrate, substitute back.

For a radical like $\sqrt{1-x^2}$, the same idea extends with a trig substitution — $x=\sin\theta$ turns $\sqrt{1-x^2}$ into $\cos\theta$, dissolving the square root into ordinary trig.

The one thing to spot before anything else: does the derivative of some piece inside the expression already sit outside it, waiting to be $du$?
