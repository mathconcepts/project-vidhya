---
# Alternative body for hypothesis-testing-worked-example, served when the
# learner stance is `assured`. The base file is what a steady student
# reads. See src/content/stance-variants.ts for how this is selected.
#
# Note: the base atom's own id is `hypothesis-testing-worked-example` (no
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
id: hypothesis-testing.worked_example.assured
concept_id: hypothesis-testing
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: hypothesis-testing-worked-example
for_stance: assured
---

## The test, resolved directly

$z=(52-50)/(6/\sqrt{36})=2/1=2$. Two-tailed critical value at $\alpha=0.05$ is $1.96$; $|z|=2>1.96$, reject $H_0$. Confirmed via $p=2P(Z>2)=2(0.0228)=0.0456<0.05$ — same call from either route, which is the actual value of computing both.

## The tail-count distinction hiding in this problem

One-tailed vs two-tailed changes the critical value, not the statistic: $H_1:\mu>50$ at $\alpha=0.05$ uses $1.645$, not $1.96$. Read the alternative's direction before picking a critical value — the $z$ arithmetic itself never changes.

## What "reject $H_0$" establishes, and what it leaves open

It says $\mu=50$ is not well supported at this level. It does NOT say $\mu=52$ (the sample mean is an estimate, not the parameter), and it never pins down $\mu$'s value beyond "probably not 50."

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: two-tailed z-test for a sample mean","steps":[{"prompt":"A sample of n=25 has x̄=103 and known σ=10. We test H₀: μ=100 vs H₁: μ≠100 at α=0.05. What is the z-statistic?","hint":"Use z = (x̄ − μ₀) / (σ/√n). The standard error is σ/√n = 10/√25 = 2.","answer":"z = (103 − 100) / 2 = 1.5"},{"prompt":"The critical value for a two-tailed test at α=0.05 is z = ±1.96. Based on z=1.5, what is the conclusion?","hint":"Compare |z| with 1.96. If |z| < 1.96, fail to reject H₀.","answer":"Since |1.5| = 1.5 < 1.96, we fail to reject H₀. There is insufficient evidence that μ ≠ 100."}]}
```
