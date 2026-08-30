---
# Alternative body for joint-distributions-worked-example, served when the
# learner stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Note: the base atom's own id is `joint-distributions-worked-example` (no
# dot before the atom type), a legacy naming drift
# check-content-integrity.ts tolerates. variant_of points at that exact id;
# this file's own id follows the normal convention instead of propagating
# the drift.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
#
# The fenced interactive block below is copied verbatim from the base
# atom so the widget cannot drift between variants; only prose differs.
id: joint-distributions.worked_example.shaken
concept_id: joint-distributions
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: joint-distributions-worked-example
for_stance: shaken
---

## Check the joint integrates to 1

$\int_0^1\int_0^y2\,dx\,dy=\int_0^1 2y\,dy=1$. Good — a valid PDF.

## Marginal of $X$: fix $x$, let $y$ range from $x$ to $1$

$f_X(x)=\int_x^1 2\,dy=2(1-x)$.

## Marginal of $Y$: fix $y$, let $x$ range from $0$ to $y$

$f_Y(y)=\int_0^y 2\,dx=2y$.

## Means

$E[X]=\int_0^1 x\cdot2(1-x)\,dx=1/3$. $E[Y]=\int_0^1 y\cdot2y\,dy=2/3$. Check: $E[X]<E[Y]$ makes sense, since $X<Y$ always on this region.

## Covariance

$E[XY]=\int_0^1\int_0^y2xy\,dx\,dy=1/4$. $\text{Cov}(X,Y)=1/4-(1/3)(2/3)=1/4-2/9=1/36$.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: variance and independence for a triangular joint PDF","steps":[{"prompt":"For the same joint PDF f(x,y) = 2, 0 < x < y < 1, compute Var(X) using Var(X) = E[X²] − (E[X])². You already know E[X] = 1/3.","hint":"Find E[X²] = ∫₀¹ x² · 2(1−x) dx. Expand: 2∫₀¹ (x² − x³) dx. Then Var(X) = E[X²] − (1/3)².","answer":"E[X²] = 2∫₀¹(x² − x³)dx = 2[x³/3 − x⁴/4]₀¹ = 2(1/3 − 1/4) = 2·(1/12) = 1/6. Var(X) = 1/6 − (1/3)² = 1/6 − 1/9 = 3/18 − 2/18 = 1/18."},{"prompt":"Are X and Y independent? Give a definitive one-sentence reason without computing the correlation.","hint":"Check whether f(x,y) = f_X(x) · f_Y(y). Also consider the support region — can the domain of X be described without reference to Y?","answer":"X and Y are NOT independent. The support domain 0 < x < y < 1 is triangular — the range of X depends on the value of Y — so the joint can never be factored as a product of marginals. Independence requires a rectangular support domain."}]}
```
