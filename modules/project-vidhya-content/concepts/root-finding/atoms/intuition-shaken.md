---
# Alternative body for root-finding.intuition, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: root-finding.intuition.shaken
concept_id: root-finding
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: root-finding-intuition
for_stance: shaken
---

## One correction, before the general formula

$f(x)=x^3-x-1$ has a root but no algebraic formula for it. Start at $x_0=1.5$: $f(1.5)=0.875$ and $f'(1.5)=5.75$. Correct the guess using where the tangent line itself crosses zero:

$$x_1=x_0-\frac{f(x_0)}{f'(x_0)}=1.5-\frac{0.875}{5.75}\approx1.3478$$

One step already moved the guess from $1.5$ toward the true root near $1.3247$.

That move — follow the tangent line down to where it hits zero, and use that crossing as the new guess — is the entire idea behind Newton-Raphson. Repeat it and, once the guess is close enough, the correction shrinks fast: each new error is roughly proportional to the square of the one before it, which is why so few repeats are usually needed once the method has caught on to a root.
