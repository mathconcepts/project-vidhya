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
variant_of: chain-rule-intuition
for_stance: shaken
---

Take the balloon from the hook: radius $r$ grows at $2$ cm/s, and volume is $V=\frac{4}{3}\pi r^3$. This is two layers stacked on each other: the inner layer is $r$, a hidden function of time $t$ (that's what "grows at $2$ cm/s" means: $r(t)=2t$); the outer layer is $V$, a function of $r$.

Differentiate each layer on its own, using only that layer's own variable. Outer: $\dfrac{dV}{dr}=4\pi r^2$ — at $t=1$s, $r=2$, so this is $4\pi(4)=16\pi$. Inner: $\dfrac{dr}{dt}=2$, always, since the radius grows at a constant rate.

Chain them by multiplying the two numbers just found: $\dfrac{dV}{dt}=16\pi\times2=32\pi\approx100.53$ cm³/s.

Check it a different way, at the same instant: $V(t)=\frac{4}{3}\pi(2t)^3$, so $V(1)=\frac43\pi(2)^3=33.51$ cm³ — and differentiating this expression directly with respect to $t$ (still using the chain rule, just not splitting it into named layers) gives the same $32\pi$. Splitting into layers only changed the bookkeeping, not the answer.

Only now does the formula deserve a name: $\dfrac{dV}{dt}=\dfrac{dV}{dr}\cdot\dfrac{dr}{dt}=f'(g(t))\cdot g'(t)$ — outer's derivative evaluated at the inner, times the inner's own derivative. Three layers, $f(g(h(x)))$, is the same multiplication done once more: peel one more layer, differentiate it on its own, multiply it in.

The one idea to hold onto: every layer peeled off on the way in owes one more factor on the way out.
