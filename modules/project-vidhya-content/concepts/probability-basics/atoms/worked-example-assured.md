---
# Alternative body for probability-basics-worked-example, served when the
# learner stance is `assured`. The base file is what a steady student
# reads. See src/content/stance-variants.ts for how this is selected.
#
# Note: the base atom's own id is `probability-basics-worked-example` (no
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
id: probability-basics.worked_example.assured
concept_id: probability-basics
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: probability-basics-worked-example
for_stance: assured
---

## The Bayes computation, resolved

$P(D)=(.02)(.6)+(.03)(.3)+(.05)(.1)=.026$. $P(M_1\mid D)=.012/.026=6/13\approx0.4615$.

## The distinction this problem is testing

The question asks $P(M_1\mid D)$ — given a defect, which machine — NOT $P(D\mid M_1)$, which was already given as $0.02$. Reading the two the same way is the single most common error on this problem type.

## Why $M_1$'s posterior share sits below its prior share

$M_1$ makes 60% of items but only 2% defective, pulling its share of DEFECTS below its share of production. $M_3$ inverts this: only 10% of output, 5% defect rate, so it punches above its production share among the defectives ($5/26\approx19\%$).

## Free check

All three posteriors sum to exactly $1$ — compute all three when time allows; a mismatch catches an arithmetic slip before it costs the mark.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Bayes' theorem for factory defect probabilities","steps":[{"prompt":"A factory has two machines: M1 produces 70% of output with a 4% defect rate, M2 produces 30% with a 10% defect rate. What is P(D), the total probability of a defective item?","hint":"Use the law of total probability: P(D) = P(D|M1)·P(M1) + P(D|M2)·P(M2). Substitute the numbers given.","answer":"P(D) = (0.04)(0.70) + (0.10)(0.30) = 0.028 + 0.030 = 0.058"},{"prompt":"Using the same factory, a defective item is found. What is the probability it came from M2?","hint":"Apply Bayes' theorem: P(M2|D) = P(D|M2)·P(M2) / P(D). You already computed P(D) = 0.058.","answer":"P(M2|D) = (0.10 × 0.30) / 0.058 = 0.030 / 0.058 = 15/29 ≈ 0.517"}]}
```
