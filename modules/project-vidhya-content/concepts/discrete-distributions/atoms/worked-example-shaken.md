---
# Alternative body for discrete-distributions.worked_example, served when
# the learner stance is `shaken`. The base file is what a steady student
# reads. See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
#
# The fenced interactive block below is copied verbatim from the base
# atom so the widget cannot drift between variants; only prose differs.
id: discrete-distributions.worked_example.shaken
concept_id: discrete-distributions
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
variant_of: discrete-distributions.worked-example
for_stance: shaken
---

## Set up first

$n=8$ trials, $p=0.15$ chance an item is defective, $X=$ number defective. Fixed trials, constant $p$: binomial.

## (a) Exactly 2 defective

$P(X=2)=\binom{8}{2}(0.15)^2(0.85)^6=28\times0.0225\times0.3771\approx0.238$.

## (b) At most 1 defective

$P(X=0)=(0.85)^8\approx0.2725$. $P(X=1)=8(0.15)(0.85)^7\approx0.3847$. Add: $P(X\le1)\approx0.657$.

## Check

Both answers sit in $[0,1]$, and $0.657>0.238$ makes sense — "at most 1" covers more outcomes than "exactly 2."

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Defect Inspection Problem","steps":[{"prompt":"Step 1: Identify the binomial parameters. What are n, p, and what are you counting?","hint":"n = number of trials, p = probability of success on each trial. Here, n = 8 (items inspected), p = 0.15 (defect rate).","answer":"n = 8, p = 0.15 (defect probability), X = number of defects. This is binomial because we have a fixed number of independent trials with constant success probability."},{"prompt":"Step 2: For part (a), calculate P(X = 2) using the binomial formula. Start with the binomial coefficient.","hint":"The binomial coefficient is C(n,k) = n! / (k!(n-k)!). For C(8,2), compute 8 × 7 / (2 × 1).","answer":"C(8,2) = 28. Then multiply by p^2 × (1-p)^6 = (0.15)^2 × (0.85)^6 = 0.0225 × 0.37649 ≈ 0.00848. Final: 28 × 0.00848 ≈ 0.238."},{"prompt":"Step 3: For part (b), find P(X ≤ 1). Which two probabilities must you calculate and add?","hint":"At most 1 means X = 0 or X = 1. Calculate both separately, then add them.","answer":"P(X = 0) = C(8,0) × (0.15)^0 × (0.85)^8 ≈ 0.272. P(X = 1) = C(8,1) × (0.15) × (0.85)^7 ≈ 0.384. Sum = 0.272 + 0.384 ≈ 0.657."}],"caption":"Binomial problems always have fixed n, constant p, and ask for cumulative or exact probabilities. Master the formula setup and arithmetic."}
```
