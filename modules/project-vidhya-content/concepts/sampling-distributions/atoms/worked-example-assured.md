---
# Alternative body for sampling-distributions.worked-example, served when
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
id: sampling-distributions.worked-example.assured
concept_id: sampling-distributions
atom_type: worked_example
bloom_level: 3
difficulty: 0.62
exam_ids: ["*"]
scaffold_fade: true
variant_of: sampling-distributions.worked-example
for_stance: assured
---

## The interval, resolved directly

$SE=8/\sqrt{16}=2$. $\sigma$ unknown $\Rightarrow$ Student's $t$, $df=15$. $\text{CI}=52\pm(2.131)(2)=52\pm4.262=(47.738,56.262)$.

## The trigger, stated precisely

"$\sigma$ unknown" is the ENTIRE condition for using $t$ over $z$ — not "small $n$," though the two usually coincide in practice, since with large $n$, $s\approx\sigma$ closely enough that $t_{n-1}\approx z$ regardless.

## The bookkeeping that's easy to get backwards

$df=n-1$ for the one-sample case, always — one degree spent estimating $\bar{x}$ before $s$ exists. Forgetting the $-1$ gives a critical value that's slightly too small, tightening the interval when it should be wider.

## What the interval does and doesn't claim

It's a 95% CONFIDENCE procedure, not a 95% probability that THIS particular $\mu$ lies in THIS particular interval — $\mu$ is fixed and unknown, and either is or isn't in $(47.738,56.262)$; the 95% describes the procedure's long-run success rate across repeated samples.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: building a t-based confidence interval","steps":[{"prompt":"With n=16, x̄=52, s=8, and σ unknown, what is the standard error SE?","hint":"SE = s / √n.","answer":"SE = 8/4 = 2"},{"prompt":"Because σ is unknown, which distribution and how many degrees of freedom should we use?","hint":"σ unknown always means Student's t, with df = n − 1.","answer":"Student's t-distribution with df = 15"},{"prompt":"Using t_{0.025,15} = 2.131, what is the 95% confidence interval for μ?","hint":"CI = x̄ ± t·SE.","answer":"(47.738, 56.262)"}],"caption":"Whenever σ is unknown, swap z for t with df = n − 1 — the fatter tails of t correctly account for the extra uncertainty from estimating σ by s."}
```
