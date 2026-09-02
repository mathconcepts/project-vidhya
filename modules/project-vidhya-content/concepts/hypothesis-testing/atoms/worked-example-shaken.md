---
# Alternative body for hypothesis-testing.worked-example, served when the
# learner stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence.
# Prose is held at or below the base atom's length, because a screen that
# is visibly longer than the one that already defeated this reader signals
# difficulty no matter how kindly it is written.
#
# The fenced interactive block below is copied verbatim from the base
# atom so the widget cannot drift between variants; only prose differs.
id: hypothesis-testing.worked-example.shaken
concept_id: hypothesis-testing
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: true
variant_of: hypothesis-testing.worked-example
for_stance: shaken
---

## Identify the test

$\sigma=6$ is known, so use $z$. $H_1:\mu\neq50$ makes it two-tailed.

## Compute

$z=\dfrac{\bar{x}-\mu_0}{\sigma/\sqrt{n}}=\dfrac{52-50}{6/\sqrt{36}}=\dfrac{2}{1}=2$.

## Compare to the critical value

Two-tailed, $\alpha=0.05$: critical values $\pm1.96$. Since $|2|>1.96$, the statistic lands in the rejection region.

## Decision

Reject $H_0$. The data are inconsistent with $\mu=50$ at the 5% level.

## Check with the p-value

$p=2\times P(Z>2)=2\times0.0228=0.0456$. Since $0.0456<0.05$, the same conclusion follows — reject. Both routes agree, and agreement is the check.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: two-tailed z-test for a sample mean","steps":[{"prompt":"A sample of n=25 has x̄=103 and known σ=10. We test H₀: μ=100 vs H₁: μ≠100 at α=0.05. What is the z-statistic?","hint":"Use z = (x̄ − μ₀) / (σ/√n). The standard error is σ/√n = 10/√25 = 2.","answer":"z = (103 − 100) / 2 = 1.5"},{"prompt":"The critical value for a two-tailed test at α=0.05 is z = ±1.96. Based on z=1.5, what is the conclusion?","hint":"Compare |z| with 1.96. If |z| < 1.96, fail to reject H₀.","answer":"Since |1.5| = 1.5 < 1.96, we fail to reject H₀. There is insufficient evidence that μ ≠ 100."}]}
```
