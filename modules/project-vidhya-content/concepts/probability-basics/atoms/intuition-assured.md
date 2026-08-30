---
# Alternative body for probability-basics-intuition, served when the
# learner stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Note: the base atom's own id is `probability-basics-intuition` (no dot),
# a legacy naming drift check-content-integrity.ts tolerates. variant_of
# points at that exact id; this file's own id follows the normal convention
# instead of propagating the drift.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: probability-basics.intuition.assured
concept_id: probability-basics
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: probability-basics-intuition
for_stance: assured
---

## The reversal that costs marks

$P(A\mid B)\neq P(B\mid A)$ in general — only equal when $P(A)=P(B)$. A test with 95% sensitivity ($P(\text{positive}\mid\text{sick})=0.95$) does NOT mean 95% of positive testers are sick; that's $P(\text{sick}\mid\text{positive})$, which depends on the disease's base rate through Bayes.

## The identity underneath every Bayes computation

$P(B)=\sum_iP(B\mid A_i)P(A_i)$ over a partition $\{A_i\}$ — this turns "prior times likelihood" into an actual denominator, and skipping it is the most common way a Bayes setup goes wrong.

## Independence: the precise test

$P(A\cap B)=P(A)P(B)$, equivalently $P(A\mid B)=P(A)$. Mutually exclusive is the OPPOSITE extreme, not a stronger independence: if $A\cap B=\emptyset$ with both positive-probability, knowing $B$ occurred tells you $A$ definitely did NOT — the least independent two events can be.
