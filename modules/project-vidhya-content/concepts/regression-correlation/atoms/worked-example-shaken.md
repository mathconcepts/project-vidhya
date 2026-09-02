---
# Alternative body for regression-correlation.worked-example, served when
# the learner stance is `shaken`. The base file is what a steady student
# reads. See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence.
# Prose is held at or below the base atom's length, because a screen that
# is visibly longer than the one that already defeated this reader signals
# difficulty no matter how kindly it is written.
#
# The fenced interactive block below is copied verbatim from the base
# atom so the widget cannot drift between variants; only prose differs.
id: regression-correlation.worked-example.shaken
concept_id: regression-correlation
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: true
variant_of: regression-correlation.worked-example
for_stance: shaken
---

## The means first

$n=5$: $\bar{x}=15/5=3$, $\bar{y}=25/5=5$.

## The slope

$b=\dfrac{\sum x_iy_i-n\bar{x}\bar{y}}{\sum x_i^2-n\bar{x}^2}=\dfrac{83-75}{55-45}=\dfrac{8}{10}=0.8$.

## The intercept

$a=\bar{y}-b\bar{x}=5-0.8(3)=2.6$.

## The line, and a check

$\hat{y}=2.6+0.8x$. At $x=\bar{x}=3$: $\hat{y}=2.6+2.4=5=\bar{y}$ — every regression line passes through the point of means, confirmed here.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: fitting ŷ = a + bx from summary statistics","steps":[{"prompt":"Given n=4, Σx=8, Σy=12, Σx²=22, Σxy=28. Compute the slope b of the regression of y on x.","hint":"Use b = (Σxy − n·x̄·ȳ) / (Σx² − n·x̄²). First find x̄ = Σx/n = 2 and ȳ = Σy/n = 3.","answer":"b = (28 − 4·2·3) / (22 − 4·4) = (28 − 24)/(22 − 16) = 4/6 = 2/3 ≈ 0.667"},{"prompt":"Now find the intercept a, and write the regression equation.","hint":"Use a = ȳ − b·x̄ with x̄=2, ȳ=3, b=2/3.","answer":"a = 3 − (2/3)·2 = 3 − 4/3 = 5/3 ≈ 1.667. Equation: ŷ = 5/3 + (2/3)x"}]}
```
