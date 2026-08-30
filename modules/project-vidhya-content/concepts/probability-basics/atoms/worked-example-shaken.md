---
# Alternative body for probability-basics-worked-example, served when the
# learner stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Note: the base atom's own id is `probability-basics-worked-example` (no
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
id: probability-basics.worked_example.shaken
concept_id: probability-basics
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: probability-basics-worked-example
for_stance: shaken
---

## The numbers, laid out first

$P(M_1)=0.6,\,P(M_2)=0.3,\,P(M_3)=0.1$ (production shares). $P(D\mid M_1)=0.02,\,P(D\mid M_2)=0.03,\,P(D\mid M_3)=0.05$ (defect rates).

## Total probability of a defect

$P(D)=(0.02)(0.6)+(0.03)(0.3)+(0.05)(0.1)=0.012+0.009+0.005=0.026$.

## Bayes, applied

$P(M_1\mid D)=\dfrac{P(D\mid M_1)P(M_1)}{P(D)}=\dfrac{0.012}{0.026}=\dfrac{6}{13}\approx0.4615$.

## Check

The three posteriors should sum to $1$: $\frac{6}{13}+\frac{9}{26}+\frac{5}{26}\approx0.4615+0.346+0.192=1.000$. They do.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Bayes' theorem for factory defect probabilities","steps":[{"prompt":"A factory has two machines: M1 produces 70% of output with a 4% defect rate, M2 produces 30% with a 10% defect rate. What is P(D), the total probability of a defective item?","hint":"Use the law of total probability: P(D) = P(D|M1)·P(M1) + P(D|M2)·P(M2). Substitute the numbers given.","answer":"P(D) = (0.04)(0.70) + (0.10)(0.30) = 0.028 + 0.030 = 0.058"},{"prompt":"Using the same factory, a defective item is found. What is the probability it came from M2?","hint":"Apply Bayes' theorem: P(M2|D) = P(D|M2)·P(M2) / P(D). You already computed P(D) = 0.058.","answer":"P(M2|D) = (0.10 × 0.30) / 0.058 = 0.030 / 0.058 = 15/29 ≈ 0.517"}]}
```
