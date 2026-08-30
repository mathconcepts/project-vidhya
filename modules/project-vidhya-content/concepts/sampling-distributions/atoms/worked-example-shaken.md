---
# Alternative body for sampling-distributions.worked_example, served when
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
id: sampling-distributions.worked_example.shaken
concept_id: sampling-distributions
atom_type: worked_example
bloom_level: 3
difficulty: 0.62
exam_ids: ["*"]
scaffold_fade: true
variant_of: sampling-distributions.worked-example
for_stance: shaken
---

## What's known, what's not

$n=16$, $\bar{x}=52$, $s=8$ — $\sigma$ is NOT known, only estimated by $s$. Given: $t_{0.025,15}=2.131$.

## Standard error, computed

$SE=\dfrac{s}{\sqrt{n}}=\dfrac{8}{\sqrt{16}}=\dfrac{8}{4}=2$.

## Which distribution, and why

$\sigma$ unknown forces Student's $t$, never $z$ — using $z$ here would understate the real uncertainty, since $s$ is itself just an estimate. Degrees of freedom: $n-1=15$.

## The interval

$\text{CI}=\bar{x}\pm t_{0.025,15}\cdot SE=52\pm(2.131)(2)=52\pm4.262$.

$$\boxed{(47.738,\ 56.262)}$$

## Check

The interval is centered exactly on $\bar{x}=52$, and its half-width, $4.262$, is a small fraction of $52$ — a sane margin for a sample of size 16.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: building a t-based confidence interval","steps":[{"prompt":"With n=16, x̄=52, s=8, and σ unknown, what is the standard error SE?","hint":"SE = s / √n.","answer":"SE = 8/4 = 2"},{"prompt":"Because σ is unknown, which distribution and how many degrees of freedom should we use?","hint":"σ unknown always means Student's t, with df = n − 1.","answer":"Student's t-distribution with df = 15"},{"prompt":"Using t_{0.025,15} = 2.131, what is the 95% confidence interval for μ?","hint":"CI = x̄ ± t·SE.","answer":"(47.738, 56.262)"}],"caption":"Whenever σ is unknown, swap z for t with df = n − 1 — the fatter tails of t correctly account for the extra uncertainty from estimating σ by s."}
```
