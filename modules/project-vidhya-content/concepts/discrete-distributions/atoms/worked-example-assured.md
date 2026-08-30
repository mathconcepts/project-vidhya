---
# Alternative body for discrete-distributions.worked_example, served when
# the learner stance is `assured`. The base file is what a steady student
# reads. See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
#
# The fenced interactive block below is copied verbatim from the base
# atom so the widget cannot drift between variants; only prose differs.
id: discrete-distributions.worked_example.assured
concept_id: discrete-distributions
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
variant_of: discrete-distributions.worked-example
for_stance: assured
---

## Recognize, then execute

Fixed $n=8$, constant $p=0.15$, independent trials → binomial, no further justification needed. $P(X=2)=\binom{8}{2}(0.15)^2(0.85)^6\approx0.238$. $P(X\le1)=(0.85)^8+8(0.15)(0.85)^7\approx0.2725+0.3847=0.657$.

## The distinction that costs marks here

"At most 1" is a CDF value, not a single PMF evaluation — identify whether the question wants $P(X=k)$ or $P(X\le k)$ before touching the formula; swapping them is the most common binomial error, not an arithmetic slip.

## When a faster route applies

If $np$ stays moderate as $n\to\infty,p\to0$, Binomial$(n,p)\to$Poisson$(np)$ — here $np=1.2$ is small enough that the approximation would already be close, though GATE expects the exact value at $n=8$; reach for the shortcut only when direct computation is genuinely heavy.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Defect Inspection Problem","steps":[{"prompt":"Step 1: Identify the binomial parameters. What are n, p, and what are you counting?","hint":"n = number of trials, p = probability of success on each trial. Here, n = 8 (items inspected), p = 0.15 (defect rate).","answer":"n = 8, p = 0.15 (defect probability), X = number of defects. This is binomial because we have a fixed number of independent trials with constant success probability."},{"prompt":"Step 2: For part (a), calculate P(X = 2) using the binomial formula. Start with the binomial coefficient.","hint":"The binomial coefficient is C(n,k) = n! / (k!(n-k)!). For C(8,2), compute 8 × 7 / (2 × 1).","answer":"C(8,2) = 28. Then multiply by p^2 × (1-p)^6 = (0.15)^2 × (0.85)^6 = 0.0225 × 0.37649 ≈ 0.00848. Final: 28 × 0.00848 ≈ 0.238."},{"prompt":"Step 3: For part (b), find P(X ≤ 1). Which two probabilities must you calculate and add?","hint":"At most 1 means X = 0 or X = 1. Calculate both separately, then add them.","answer":"P(X = 0) = C(8,0) × (0.15)^0 × (0.85)^8 ≈ 0.272. P(X = 1) = C(8,1) × (0.15) × (0.85)^7 ≈ 0.384. Sum = 0.272 + 0.384 ≈ 0.657."}],"caption":"Binomial problems always have fixed n, constant p, and ask for cumulative or exact probabilities. Master the formula setup and arithmetic."}
```
