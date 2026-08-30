---
# Alternative body for fourier-series.intuition, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: fourier-series-intuition.shaken
concept_id: fourier-series
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: fourier-series-intuition
for_stance: shaken
---

Take $f(x)=x$ on $(-\pi,\pi)$. Check one thing first: is it even or odd? Plug in $-x$: $f(-x)=-x=-f(x)$, so it is odd.

That check already tells you two of the three coefficient families are zero before any integral is computed:

$$a_0=0,\qquad a_n=0\ \text{for every }n,\qquad b_n=\frac{1}{\pi}\int_{-\pi}^{\pi}x\sin(nx)\,dx\neq 0$$

Only the sine terms survive. That is the whole point of checking symmetry first — it is not a shortcut for later, it decides which integrals you even need to write down.

Now look at where the series is allowed to land. At $x=\pi$ the periodic copy of $f$ jumps from $\pi$ down to $-\pi$. The series does not chase either value; it converges to their average:

$$\frac{\pi+(-\pi)}{2}=0$$

Every sine term in the series is $0$ at $x=\pi$ too, since $\sin(n\pi)=0$ — so the series and the average agree, and that agreement is your check.

One idea to hold onto: parity decides which coefficients can be nonzero, and at a jump the series settles on the midpoint of the jump, not on either side of it.
