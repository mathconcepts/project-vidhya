---
# Alternative body for joint-distributions-intuition, served when the
# learner stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Note: the base atom's own id is `joint-distributions-intuition` (no dot),
# a legacy naming drift check-content-integrity.ts tolerates. variant_of
# points at that exact id; this file's own id follows the normal convention
# instead of propagating the drift.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: joint-distributions.intuition.shaken
concept_id: joint-distributions
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: joint-distributions-intuition
for_stance: shaken
---

## Two variables, one joint rule

Joint PMF: $p(x,y)=P(X=x,Y=y)$, and every joint probability in the table sums to $1$.

## Getting one variable back out

To find $X$'s distribution alone, sum away $Y$: $p_X(x)=\sum_y p(x,y)$. Concretely — if $p(1,1)=0.2$ and $p(1,2)=0.3$, then $p_X(1)=0.5$, whatever $Y$ did.

## Given information, updated

$P(X=x\mid Y=y)=\dfrac{p(x,y)}{p_Y(y)}$ — the joint value rescaled so it sums to $1$ over the slice where $Y=y$ actually happened.

## Independence needs a factoring test AND a domain check

$X,Y$ independent iff $p(x,y)=p_X(x)p_Y(y)$ everywhere. Check the domain first: on $0<x<y<1$, $x$'s range depends on $y$, so no factoring is possible regardless of the formula — the region's shape alone rules out independence.

## Covariance sign, concretely

If $Y$ tends to be large exactly when $X$ is large, $\text{Cov}(X,Y)>0$. $\rho$ rescales that into $[-1,1]$. $\rho=0$ says no LINEAR trend — it does not say independent.
