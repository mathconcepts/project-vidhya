---
# Alternative body for improper-integrals.intuition, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: improper-integrals.intuition.shaken
concept_id: improper-integrals
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
variant_of: improper-integrals.intuition
for_stance: shaken
---

$\int_1^\infty\frac{dx}{x^2}$ has an infinite upper limit — replace $\infty$ with a finite number $R$ first: $\int_1^R\frac{dx}{x^2}=\left[-\frac1x\right]_1^R=1-\frac1R$. At $R=10$, that's $0.9$; at $R=1000$, it's $0.999$. As $R\to\infty$, $\frac1R\to0$, so the whole thing settles at exactly $1$. Because that limit is a finite number, the integral **converges** to $1$.

A different kind of infinity shows up when the function itself blows up inside the interval. Take $\int_0^1\frac{dx}{\sqrt x}$: the integrand shoots to $\infty$ at $x=0$. Replace the bad endpoint with $\epsilon>0$ first: $\int_\epsilon^1 x^{-1/2}\,dx=\left[2\sqrt x\right]_\epsilon^1=2-2\sqrt\epsilon$. At $\epsilon=0.01$, that's $2-0.2=1.8$; as $\epsilon\to0^+$, $2\sqrt\epsilon\to0$, so the limit is $2$ — this one converges too, even though the curve itself is unbounded.

Whenever the limit settles on a finite number, the integral converges to that number. Whenever the limit grows without bound or refuses to settle, it diverges.
