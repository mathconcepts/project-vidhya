---
# Alternative body for implicit-differentiation.intuition, served when the
# learner stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: implicit-differentiation.intuition.shaken
concept_id: implicit-differentiation
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: implicit-differentiation-intuition
for_stance: shaken
---

Take the circle $x^2+y^2=25$ (so $r=5$). Solving for $y$ gives two branches, $y=\sqrt{25-x^2}$ and $y=-\sqrt{25-x^2}$ — awkward to differentiate separately and easy to mix up which branch you're on.

Instead, differentiate the equation exactly as written, treating $y$ as a hidden function of $x$. Every time a term contains $y$, its derivative picks up an extra factor of $\frac{dy}{dx}$ — for instance $\frac{d}{dx}[y^2]=2y\cdot\frac{dy}{dx}$, because $y^2$ is really $[y(x)]^2$, and that is just the chain rule.

Apply it here: $\frac{d}{dx}[x^2+y^2]=\frac{d}{dx}[25]$ gives $2x+2y\frac{dy}{dx}=0$.

Collect $\frac{dy}{dx}$ on one side: $2y\frac{dy}{dx}=-2x$, so $\frac{dy}{dx}=-\frac{x}{y}$.

Check it at $(3,4)$, which sits on the circle since $3^2+4^2=25$: $\frac{dy}{dx}=-\frac34$. One formula, valid on both the upper and lower half of the circle — no branch-splitting needed.

One more pattern worth having ready: $xy$ mixes $x$ and $y$ together, so it needs the product rule *and* the chain rule at once: $\frac{d}{dx}[xy]=x\cdot\frac{dy}{dx}+y\cdot1$.

Every $y$-term picks up a $\frac{dy}{dx}$ factor; every $x$-only term does not.
