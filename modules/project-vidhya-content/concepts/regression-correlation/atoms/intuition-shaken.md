---
# Alternative body for regression-correlation.intuition, served when the
# learner stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: regression-correlation.intuition.shaken
concept_id: regression-correlation
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: regression-correlation.intuition
for_stance: shaken
---

## Correlation, from the numbers up

The hook's three points: $(2,65),(4,72),(6,85)$ — study hours vs. score. Here $\bar{x}=4,\bar{y}=74$. Pearson's $r$ measures how tightly $y$ tracks a straight line through $x$: $r=+1$ perfect uphill, $r=-1$ perfect downhill, $r=0$ no LINEAR trend. For these three points, $r\approx0.985$ — a strong uphill trend, but not perfect: the middle point sits a little off the line.

## The best-fit line, built from two numbers

$\hat{y}=a+bx$. The slope $b=\dfrac{\sum(x_i-\bar{x})(y_i-\bar{y})}{\sum(x_i-\bar{x})^2}$ is chosen to make the total squared vertical miss as small as possible. For the hook's three points: $b=40/8=5$ and $a=74-5(4)=54$, so $\hat{y}=54+5x$. At $x=4$: $\hat{y}=74$ — close to, but not exactly, the actual score of $72$.

## What $R^2$ actually says

$R^2=r^2\in[0,1]$. Here $R^2\approx0.97$: about 97% of the scatter in scores lines up with study hours on this small sample — the remaining ~3% (the gap between the predicted $74$ and the actual $72$) is what the line can't explain.

## The line linking $b$ and $r$

$b=r\cdot\dfrac{s_y}{s_x}$ — the slope is the correlation rescaled by how much $y$ spreads relative to $x$.

## Three ways this goes wrong on an exam

A high $r$ between two things doesn't mean one causes the other. Predicting outside the observed $x$-range is a guess, not a computation. And "regression of $y$ on $x$" is not the same line as "regression of $x$ on $y$" unless $|r|=1$.
