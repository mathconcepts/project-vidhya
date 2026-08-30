---
# Alternative body for random-variables-worked-example, served when the
# learner stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Note: the base atom's own id is `random-variables-worked-example` (no
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
id: random-variables.worked_example.shaken
concept_id: random-variables
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: random-variables-worked-example
for_stance: shaken
---

## Binomial part

$X\sim B(10,0.3)$. $P(X=3)=\binom{10}{3}(0.3)^3(0.7)^7=120\times0.027\times0.0823543\approx0.2668$.

$E[X]=np=3$, $\text{Var}(X)=np(1-p)=2.1$.

## Poisson part

$X\sim\text{Po}(2)$. $P(X=0)=e^{-2}\approx0.1353$, $P(X=1)=2e^{-2}\approx0.2707$. Add: $P(X\le1)\approx0.4060$.

## Check

Both final answers, $0.2668$ and $0.4060$, sit in $[0,1]$ — and for Poisson, mean equals variance equals $2$, a fast identity worth confirming whenever $\lambda$ is given directly.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: binomial P(X=3) and Poisson P(X≤1) computations","steps":[{"prompt":"Let X ~ Poisson(λ=3). What is P(X = 2)?","hint":"Use the Poisson PMF: P(X=k) = e^{-λ} · λ^k / k!. Substitute λ=3 and k=2. Recall e^{-3} ≈ 0.0498.","answer":"P(X=2) = e^{-3} · 3² / 2! = e^{-3} · 9 / 2 = 4.5 · e^{-3} ≈ 4.5 × 0.0498 ≈ 0.2240"},{"prompt":"For X ~ B(n=5, p=0.4), use the computing formula Var(X) = E[X²] − (E[X])² to verify Var(X) = np(1−p).","hint":"First compute E[X] = np = 2. Then E[X²] = Var(X) + (E[X])² = 1.2 + 4 = 5.2. Check: np(1-p) = 5 × 0.4 × 0.6 = 1.2.","answer":"E[X] = np = 5 × 0.4 = 2. Var(X) = np(1−p) = 5 × 0.4 × 0.6 = 1.2. Using the computing formula: E[X²] = Var(X) + (E[X])² = 1.2 + 4 = 5.2, and Var(X) = E[X²] − (E[X])² = 5.2 − 4 = 1.2. Both methods agree."}]}
```
