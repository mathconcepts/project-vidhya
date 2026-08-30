---
# Alternative body for chain-rule.intuition, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: chain-rule.intuition.shaken
concept_id: chain-rule
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: chain-rule.intuition
for_stance: shaken
---

Take $y=(2x+1)^5$ at $x=1$. Split it into two layers: inner $u=2x+1$, outer $y=u^5$. At $x=1$, $u=3$.

Differentiate each layer on its own, using only that layer's own variable. Outer: $\frac{dy}{du}=5u^4$, which at $u=3$ is $5(81)=405$. Inner: $\frac{du}{dx}=2$.

Chain them by multiplying the two numbers just found: $\frac{dy}{dx}=405\times2=810$.

Check it without ever introducing $u$: $\frac{d}{dx}(2x+1)^5=5(2x+1)^4\cdot2=5(3)^4\cdot2=810$ — same number, so splitting into layers only changed the bookkeeping, not the answer.

Only now does the formula deserve a name: $\dfrac{dy}{dx}=\dfrac{dy}{du}\cdot\dfrac{du}{dx}=f'(g(x))\cdot g'(x)$ — outer's derivative evaluated at the inner, times the inner's own derivative. Three layers, $f(g(h(x)))$, is the same multiplication done once more: peel one more layer, differentiate it on its own, multiply it in.

The one idea to hold onto: every layer peeled off on the way in owes one more factor on the way out.
