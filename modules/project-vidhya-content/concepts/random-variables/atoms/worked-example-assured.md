---
# Alternative body for random-variables-worked-example, served when the
# learner stance is `assured`. The base file is what a steady student
# reads. See src/content/stance-variants.ts for how this is selected.
#
# Note: the base atom's own id is `random-variables-worked-example` (no
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
id: random-variables.worked_example.assured
concept_id: random-variables
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: random-variables-worked-example
for_stance: assured
---

## Binomial and Poisson, both resolved

$P(X=3)=\binom{10}{3}(0.3)^3(0.7)^7\approx0.2668$; $E[X]=3$, $\text{Var}(X)=2.1$. $P(X\le1)=e^{-2}+2e^{-2}=3e^{-2}\approx0.4060$.

## When to swap one for the other

$np=3$ here isn't small enough to justify approximating the binomial by Poisson — reserve that shortcut for $n$ large, $p$ small, $np$ moderate. This problem wants the exact binomial value, computed directly.

## The identity that catches an arithmetic slip

For Poisson, mean equals variance equals $\lambda$ always — here both equal $2$ by construction, so if a derived variance disagrees with the given $\lambda$, the error is upstream. No equivalent free check exists for binomial; $E[X^2]=\text{Var}(X)+(E[X])^2$ is the closest, and it needs both sides actually computed.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: binomial P(X=3) and Poisson P(X≤1) computations","steps":[{"prompt":"Let X ~ Poisson(λ=3). What is P(X = 2)?","hint":"Use the Poisson PMF: P(X=k) = e^{-λ} · λ^k / k!. Substitute λ=3 and k=2. Recall e^{-3} ≈ 0.0498.","answer":"P(X=2) = e^{-3} · 3² / 2! = e^{-3} · 9 / 2 = 4.5 · e^{-3} ≈ 4.5 × 0.0498 ≈ 0.2240"},{"prompt":"For X ~ B(n=5, p=0.4), use the computing formula Var(X) = E[X²] − (E[X])² to verify Var(X) = np(1−p).","hint":"First compute E[X] = np = 2. Then E[X²] = Var(X) + (E[X])² = 1.2 + 4 = 5.2. Check: np(1-p) = 5 × 0.4 × 0.6 = 1.2.","answer":"E[X] = np = 5 × 0.4 = 2. Var(X) = np(1−p) = 5 × 0.4 × 0.6 = 1.2. Using the computing formula: E[X²] = Var(X) + (E[X])² = 1.2 + 4 = 5.2, and Var(X) = E[X²] − (E[X])² = 5.2 − 4 = 1.2. Both methods agree."}]}
```
