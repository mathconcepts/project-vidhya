---
# Alternative body for improper-integrals.worked_example, served when the
# learner stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: improper-integrals.worked_example.assured
concept_id: improper-integrals
atom_type: worked_example
bloom_level: 3
difficulty: 0.3
exam_ids: ["*"]
scaffold_fade: true
variant_of: improper-integrals.worked_example
for_stance: assured
---

Classify before integrating: $x^{-1/2}$ near $x=0$ has $p=\tfrac12<1$, so the point-test predicts convergence before a single line of algebra runs. The value follows the standard back-off pattern for any Type II point-singularity: replace the trouble endpoint with $\varepsilon$, integrate, let $\varepsilon\to0^+$.
$$
\lim_{\varepsilon\to0^+}\left[2x^{1/2}\right]_\varepsilon^1=2-\lim_{\varepsilon\to0^+}2\sqrt\varepsilon=2.
$$
$$
\boxed{\int_0^1 x^{-1/2}\,dx=2}
$$

Contrast this with $\int_0^1 x^{-2}\,dx$: same shape of problem, but $p=2>1$ this time — the point-test predicts divergence, and indeed $\left[-x^{-1}\right]_\varepsilon^1=-1+\tfrac1\varepsilon\to\infty$ as $\varepsilon\to0^+$. Two integrands that look structurally identical, differing only in the exponent's side of $p=1$, land on opposite sides of convergent and divergent — classify first, compute second, and let the classification catch an arithmetic answer that contradicts it.
