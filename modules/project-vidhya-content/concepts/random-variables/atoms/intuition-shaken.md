---
# Alternative body for random-variables-intuition, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Note: the base atom's own id is `random-variables-intuition` (no dot), a
# legacy naming drift check-content-integrity.ts tolerates. variant_of
# points at that exact id; this file's own id follows the normal convention
# instead of propagating the drift.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: random-variables.intuition.shaken
concept_id: random-variables
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: random-variables-intuition
for_stance: shaken
---

## Discrete: a countable list, each value with a weight

Roll a die: $X\in\{1,\dots,6\}$, $p(x)=1/6$ each, and $\sum p(x)=1$.

## Continuous: no single value has weight, only ranges do

$X$ uniform on $[0,1]$: $f(x)=1$ there, and $P(0.2<X<0.5)=0.3$ — an area, not a lookup.

## The CDF works for both

$F(x)=P(X\le x)$. For the die, $F(3)=3/6=0.5$. It only ever rises (or stays flat), from $0$ toward $1$.

## Expected value, computed once

Die roll: $E[X]=\sum x\,p(x)=(1+2+3+4+5+6)/6=3.5$ — not even a possible outcome, but the long-run average.

## Variance, both ways

$\text{Var}(X)=E[X^2]-(E[X])^2$. For the die: $E[X^2]=(1+4+9+16+25+36)/6=91/6\approx15.17$, so $\text{Var}(X)\approx15.17-12.25=2.92$.

## One rule that never breaks

$E[2X+1]=2E[X]+1=8$ for the die — scale and shift the mean the same way you'd scale and shift $X$ itself.
