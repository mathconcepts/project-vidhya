---
# Alternative body for probability-basics-intuition, served when the
# learner stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Note: the base atom's own id is `probability-basics-intuition` (no dot),
# a legacy naming drift check-content-integrity.ts tolerates. variant_of
# points at that exact id; this file's own id follows the normal convention
# instead of propagating the drift.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: probability-basics.intuition.shaken
concept_id: probability-basics
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: probability-basics-intuition
for_stance: shaken
---

## The sample space, listed

A single die roll: $\Omega=\{1,2,3,4,5,6\}$, all six outcomes equally likely. "Even" is $A=\{2,4,6\}$, so $P(A)=3/6=1/2$ — three favorable out of six total, counted directly.

## Three rules that must hold

$P(A)\ge0$; $P(\Omega)=1$; if two events share no outcomes, their probabilities add. "Even" and "odd" share nothing, so $P(\text{even or odd})=1/2+1/2=1$, the whole space.

## When events overlap

"Even" $=\{2,4,6\}$ and "greater than 3" $=\{4,5,6\}$ DO overlap, at $\{4,6\}$. Adding both probabilities double-counts that overlap, so subtract it once: $P(A\cup B)=1/2+1/2-2/6=2/3$.

## Zooming in with conditioning

Given the roll is even, what's the chance it also exceeds $3$? Restrict to $\{2,4,6\}$: two of those three, $4$ and $6$, exceed $3$. So $P(>3\mid\text{even})=2/3$, a fraction of the restricted set.

## Independence, checked by multiplying

Two separate die rolls: $P(\text{both }6)=\frac{1}{6}\times\frac{1}{6}=\frac{1}{36}$ — knowing the first roll tells you nothing about the second.

## Reversing direction

Bayes flips which event conditions on which: $P(A\mid B)=\frac{P(B\mid A)P(A)}{P(B)}$, with the denominator built from the law of total probability.
