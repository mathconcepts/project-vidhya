---
# Alternative body for joint-distributions-worked-example, served when the
# learner stance is `assured`. The base file is what a steady student
# reads. See src/content/stance-variants.ts for how this is selected.
#
# Note: the base atom's own id is `joint-distributions-worked-example` (no
# dot before the atom type), a legacy naming drift
# check-content-integrity.ts tolerates. variant_of points at that exact id;
# this file's own id follows the normal convention instead of propagating
# the drift.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
#
# The fenced interactive block below is copied verbatim from the base
# atom so the widget cannot drift between variants; only prose differs.
id: joint-distributions.worked_example.assured
concept_id: joint-distributions
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: joint-distributions-worked-example
for_stance: assured
---

## The moments, resolved directly

Valid PDF: $\int_0^1\int_0^y2\,dx\,dy=1$. Marginals: $f_X(x)=2(1-x)$, $f_Y(y)=2y$. Means: $E[X]=1/3$, $E[Y]=2/3$. $E[XY]=\int_0^1\int_0^y2xy\,dx\,dy=1/4$, so $\text{Cov}(X,Y)=1/4-2/9=1/36$.

## The one thing worth stating before integrating anything

The support $0<x<y<1$ is triangular, so $X,Y$ cannot be independent regardless of what the covariance comes out to — the positive value found here is consistent with dependence, not the cause of it.

## The recurring pattern worth recognizing

Any joint uniform on a triangular region has this shape: the marginal of whichever variable bounds the other from below or above is linear in that variable, and the two means split the unit interval unevenly toward whichever variable is systematically larger.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: variance and independence for a triangular joint PDF","steps":[{"prompt":"For the same joint PDF f(x,y) = 2, 0 < x < y < 1, compute Var(X) using Var(X) = E[X²] − (E[X])². You already know E[X] = 1/3.","hint":"Find E[X²] = ∫₀¹ x² · 2(1−x) dx. Expand: 2∫₀¹ (x² − x³) dx. Then Var(X) = E[X²] − (1/3)².","answer":"E[X²] = 2∫₀¹(x² − x³)dx = 2[x³/3 − x⁴/4]₀¹ = 2(1/3 − 1/4) = 2·(1/12) = 1/6. Var(X) = 1/6 − (1/3)² = 1/6 − 1/9 = 3/18 − 2/18 = 1/18."},{"prompt":"Are X and Y independent? Give a definitive one-sentence reason without computing the correlation.","hint":"Check whether f(x,y) = f_X(x) · f_Y(y). Also consider the support region — can the domain of X be described without reference to Y?","answer":"X and Y are NOT independent. The support domain 0 < x < y < 1 is triangular — the range of X depends on the value of Y — so the joint can never be factored as a product of marginals. Independence requires a rectangular support domain."}]}
```
