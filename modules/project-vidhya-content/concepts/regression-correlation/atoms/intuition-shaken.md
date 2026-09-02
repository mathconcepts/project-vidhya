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

$n=5$ points, $\bar{x}=3,\bar{y}=5$. Pearson's $r$ measures how tightly $y$ tracks a straight line through $x$: $r=+1$ perfect uphill, $r=-1$ perfect downhill, $r=0$ no LINEAR trend.

## The best-fit line, built from two numbers

$\hat{y}=a+bx$. The slope $b=\dfrac{\sum(x_i-\bar{x})(y_i-\bar{y})}{\sum(x_i-\bar{x})^2}$ is chosen to make the total squared vertical miss as small as possible.

## What $R^2$ actually says

$R^2=r^2\in[0,1]$. If $R^2=0.64$, then 64% of $y$'s variation lines up with $x$'s — the remaining 36% is unexplained by this line.

## The line linking $b$ and $r$

$b=r\cdot\dfrac{s_y}{s_x}$ — the slope is the correlation rescaled by how much $y$ spreads relative to $x$.

## Three ways this goes wrong on an exam

A high $r$ between two things doesn't mean one causes the other. Predicting outside the observed $x$-range is a guess, not a computation. And "regression of $y$ on $x$" is not the same line as "regression of $x$ on $y$" unless $|r|=1$.
