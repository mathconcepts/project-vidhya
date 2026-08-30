---
# Alternative body for continuity.intuition, served when the learner stance
# is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: continuity.intuition.shaken
concept_id: continuity
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: continuity.intuition
for_stance: shaken
---

Look at $f(x)=\frac{x^2-4}{x-2}$ near $x=2$. At $x=1.99$, $f=3.99$; at $x=2.01$, $f=4.01$ — both sides are sliding toward $4$. So the limit exists and equals $4$. But evaluate $f$ *at* $x=2$ itself: $\frac{2^2-4}{2-2}=\frac{0}{0}$, undefined. The graph has one missing point sitting exactly where the two sides were heading.

That single example already carries the whole test. A function is continuous at a point when three things line up: the function has a value there, the two-sided limit exists there, and those two numbers *agree*. Here the first check already fails — $f(2)$ doesn't exist — so it never even reaches the third.

Not every break looks like a hole. Take $f(x)=0$ for $x<0$ and $f(x)=1$ for $x\ge0$. At $x=-0.01$, $f=0$; at $x=0.01$, $f=1$. The left side heads to $0$, the right side heads to $1$ — two different destinations, so there is no single limit at all. That is a jump, not a hole: no single redefinition patches it, because both sides disagree about where they are going.

A third kind: $f(x)=\frac1x$ near $x=0$ does not settle anywhere — as $x\to0^+$, $f\to+\infty$.

One more fact worth having ready: if $f$ is continuous on $[a,b]$ and $f(a)$, $f(b)$ have opposite signs, $f$ must cross zero somewhere in between — an unbroken curve cannot get from a negative value to a positive one without passing through $0$.

Check the value, check the limit, then check that the two agree — in that order, stopping the moment one of them fails.
