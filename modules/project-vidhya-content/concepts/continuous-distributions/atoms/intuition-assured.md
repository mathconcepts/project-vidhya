---
# Alternative body for continuous-distributions-intuition, served when the
# learner stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Note: the base atom's own id is `continuous-distributions-intuition` (no
# dot), a legacy naming drift check-content-integrity.ts tolerates.
# variant_of points at that exact id; this file's own id follows the normal
# convention instead of propagating the drift.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: continuous-distributions.intuition.assured
concept_id: continuous-distributions
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: continuous-distributions-intuition
for_stance: assured
---

## The families, and what distinguishes each

Normal is symmetric, fully described by $(\mu,\sigma)$; standardize via $Z=(X-\mu)/\sigma$ and read $\Phi$. Exponential is memoryless — $P(X>s+t\mid X>s)=P(X>t)$ — the only continuous distribution with that property, the tell for "waiting time, no aging" problems. Uniform is the one where the density itself answers "how likely, relatively," since it's constant on its support.

## Where marks are actually lost

Treating $f(x)$ as a probability: a tight Normal easily has $f(x)>1$, while $P(a<X<b)\in[0,1]$ always. Confusing $\chi^2_k$'s role (testing variance) with $t_k$'s (testing a mean when $\sigma$ is unknown) — both derive from normals, neither substitutes for the other.

## The fast identity worth having

MGFs are unique: $M_X(t)=M_Y(t)$ on an interval forces $X,Y$ to share a distribution. It's the shortest route to proving a sum of independent normals is itself normal — no convolution integral required.
