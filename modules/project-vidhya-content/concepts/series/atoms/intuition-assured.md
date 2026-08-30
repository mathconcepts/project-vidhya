---
# Alternative body for series.intuition, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: series.intuition.assured
concept_id: series
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
variant_of: series.intuition
for_stance: assured
---

Convergence and absolute convergence are different claims: the alternating harmonic series $\sum\frac{(-1)^{n+1}}n=1-\frac12+\frac13-\cdots$ converges (to $\ln2$), but $\sum\left|\frac{(-1)^{n+1}}n\right|=\sum\frac1n$ diverges — it converges *conditionally*, not absolutely.

The distinction is not cosmetic: a conditionally convergent series can be rearranged to sum to *any* target value, or to diverge entirely, by the Riemann rearrangement theorem — reordering terms is only guaranteed safe for an absolutely convergent series. This is why the ratio and root tests, which test $|a_n|$, establish the *stronger* claim whenever they succeed, and why "converges" on an exam answer needs the conditional/absolute distinction stated if the question asks for it.

The $n$-th term test is a one-way filter: $a_n\not\to0\Rightarrow$ divergence, but $a_n\to0$ proves nothing — it is the necessary condition every convergent series satisfies, never a sufficient one, and treating it as sufficient is the harmonic series' standing counterexample.
