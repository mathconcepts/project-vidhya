---
# Alternative body for improper-integrals.intuition, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: improper-integrals.intuition.assured
concept_id: improper-integrals
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
variant_of: improper-integrals.intuition
for_stance: assured
---

Comparison only proves what its direction supports: to show $\int f$ converges, you need $0\le f\le g$ with $\int g$ **convergent** — bounding above by something small enough. To show divergence, you need $f\ge g\ge0$ with $\int g$ **divergent** — bounding below by something too big to shrink. Using the wrong direction — bounding a suspected-divergent integrand above by something convergent — proves nothing at all.

The doubly-infinite case is where symmetric cancellation fakes convergence: $\int_{-\infty}^{\infty}x\,dx$, evaluated as $\lim_{R\to\infty}\int_{-R}^{R}x\,dx=\lim_{R\to\infty}0=0$, looks like it converges to $0$. It does not — the definition splits at any finite point and requires *each* piece, $\int_{-\infty}^{0}$ and $\int_0^{\infty}$, to converge **independently**; here both diverge (to $-\infty$ and $+\infty$), so the integral diverges despite the symmetric limit being finite. That symmetric shortcut is the Cauchy principal value, a weaker notion than convergence.
