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
variant_of: improper-integrals.intuition
for_stance: shaken
---

Case A: $\int_1^\infty x^{-2}dx$. Domain runs to infinity, exponent $p=2$. Antiderivative: $-x^{-1}$. Limit as $N\to\infty$ of $-\tfrac1N-(-1)=1$. Finite — converges.

Case B: $\int_0^1 x^{-1/2}dx$. Domain is finite, but the integrand blows up at $x=0$. Antiderivative: $2x^{1/2}$. Limit as $\varepsilon\to0$ of $2-2\sqrt\varepsilon=2$. Finite — converges too.

Both converge, but for opposite reasons: Case A needed a LARGE exponent ($p>1$); Case B needed a SMALL one ($p<1$, here $p=\tfrac12$). Check which kind of trouble spot you have — infinity, or a finite point — before picking a direction for the exponent rule.
