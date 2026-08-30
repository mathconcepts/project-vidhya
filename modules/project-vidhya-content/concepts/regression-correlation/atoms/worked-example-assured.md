---
# Alternative body for regression-correlation-worked-example, served when
# the learner stance is `assured`. The base file is what a steady student
# reads. See src/content/stance-variants.ts for how this is selected.
#
# Note: the base atom's own id is `regression-correlation-worked-example`
# (no dot before the atom type), a legacy naming drift
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
id: regression-correlation.worked_example.assured
concept_id: regression-correlation
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: regression-correlation-worked-example
for_stance: assured
---

## The fit, resolved directly

$\bar{x}=3,\bar{y}=5$. $b=(83-75)/(55-45)=0.8$. $a=5-0.8(3)=2.6$. $\hat{y}=2.6+0.8x$, and it passes through $(\bar{x},\bar{y})$ by construction — always true for any regression line.

## The bonus worth computing even when not asked

With $\sum y_i^2=135$: $S_{xx}=10,S_{yy}=10,S_{xy}=8$, so $r=8/\sqrt{10\cdot10}=0.8$ and $R^2=0.64$ — 64% of $y$'s spread lines up with $x$'s.

## The check that catches a sign or arithmetic slip

$b=r\cdot s_y/s_x$; here $s_x=s_y$ (since $S_{xx}=S_{yy}$), so $b$ should equal $r$ exactly — and it does, $0.8=0.8$. When $S_{xx}\neq S_{yy}$ this equality won't hold, but $b=r\cdot\sqrt{S_{yy}/S_{xx}}$ always will.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: fitting ŷ = a + bx from summary statistics","steps":[{"prompt":"Given n=4, Σx=8, Σy=12, Σx²=22, Σxy=28. Compute the slope b of the regression of y on x.","hint":"Use b = (Σxy − n·x̄·ȳ) / (Σx² − n·x̄²). First find x̄ = Σx/n = 2 and ȳ = Σy/n = 3.","answer":"b = (28 − 4·2·3) / (22 − 4·4) = (28 − 24)/(22 − 16) = 4/6 = 2/3 ≈ 0.667"},{"prompt":"Now find the intercept a, and write the regression equation.","hint":"Use a = ȳ − b·x̄ with x̄=2, ȳ=3, b=2/3.","answer":"a = 3 − (2/3)·2 = 3 − 4/3 = 5/3 ≈ 1.667. Equation: ŷ = 5/3 + (2/3)x"}]}
```
