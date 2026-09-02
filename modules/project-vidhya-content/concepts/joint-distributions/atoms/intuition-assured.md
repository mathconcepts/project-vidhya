---
# Alternative body for joint-distributions.intuition, served when the
# learner stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: joint-distributions.intuition.assured
concept_id: joint-distributions
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: joint-distributions.intuition
for_stance: assured
---

## The check that actually matters

$f(x,y)=f_X(x)f_Y(y)$ pointwise, on a domain where $x$ and $y$ range freely of each other, is the real independence test — a triangular support like $0<x<y<1$ fails it structurally, before any integral is even computed, since $x$'s range depends on $y$.

## The direction that only goes one way

Independence $\Rightarrow\rho=0$, always. $\rho=0\Rightarrow$ independence, never guaranteed — $\rho$ measures only linear association, and a variable can be a deterministic (even quadratic) function of another with zero correlation.

## The identity that saves a derivation

$\text{Var}(X\pm Y)=\text{Var}(X)+\text{Var}(Y)\pm2\text{Cov}(X,Y)$. Under independence the covariance term vanishes and both sums and differences get the SAME variance — worth having cold, since a hurried solver often keeps the sign flip for the minus case but drops it for the covariance term itself.
