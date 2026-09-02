---
# Alternative body for definite-integrals.worked_example, served when the
# learner stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: definite-integrals.worked_example.assured
concept_id: definite-integrals
atom_type: worked_example
bloom_level: 3
difficulty: 0.2
exam_ids: ["*"]
scaffold_fade: true
variant_of: definite-integrals.worked_example
for_stance: assured
---

Two ways close a definite-integral substitution: convert the bounds into $u$ once ($u:1\to2$) and never return to $x$, or keep the antiderivative in $x$ and skip the bound conversion. Both are correct; only the first is safe under time pressure, since the second needs an extra back-substitution step that is where careless slips actually happen — a wrong final swap can silently survive to the boxed answer. The bounds-in-$u$ route also flags a subtlety converting-back always hides: if $u=g(x)$ is not monotonic on $[a,b]$, the integral in $u$ can retrace territory, and only splitting the interval first — never a straight bound conversion — is valid.

$$
\int_1^2 \frac{du}{u}=\ln 2.
$$
$$
\boxed{\int_0^1 \frac{2x}{1+x^2}\,dx=\ln 2\approx 0.6931}
$$
