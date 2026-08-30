---
# Alternative body for series.worked_example, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: series.worked_example.assured
concept_id: series
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
variant_of: series.worked_example
for_stance: assured
---

Factorial in the denominator against polynomial-times-exponential in the numerator is the instant tell: $n!$ eventually outgrows $c^n\cdot n^k$ for any fixed $c,k$, so the series converges before any computation — the Ratio Test below is the formal proof, not the discovery.

$\dfrac{a_{n+1}}{a_n}=\dfrac{2(n+1)}{n^2}\to0<1$.

**Answer:** converges absolutely.

The genuine gap in "factorial always wins": the Ratio Test itself is silent whenever the limit equals exactly $1$ — that boundary case needs a different test (integral, comparison, or a sharper asymptotic estimate), since $L=1$ is consistent with either convergence or divergence depending on the series. Nothing about factorials guarantees the limit lands strictly below $1$ in general; it does here because $\frac{2(n+1)}{n^2}$ genuinely goes to $0$, not merely because a factorial is present.

The pattern generalizes: for $\sum\dfrac{n^k\cdot c^n}{n!}$, the ratio always reduces to something $\propto\frac1n$, forcing the limit to $0$ regardless of the specific $k$ or $c$ — the series converges for every fixed $k$ and $c$, not just this pair.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Ratio Test with factorials","steps":[{"prompt":"Step 1: Which convergence test should we use for a series with factorials in the denominator?","hint":"Think about which test simplifies factorial ratios nicely.","answer":"The Ratio Test, because $\\frac{n!}{(n+1)!} = \\frac{1}{n+1}$ simplifies instantly."},{"prompt":"Step 2: Compute $\\frac{a_{n+1}}{a_n}$ where $a_n = \\frac{n^2 \\cdot 2^n}{n!}$.","hint":"Write $(n+1)! = (n+1) \\cdot n!$ and $2^{n+1} = 2 \\cdot 2^n$, then cancel.","answer":"$\\frac{a_{n+1}}{a_n} = \\frac{2(n+1)}{n^2}$"},{"prompt":"Step 3: What is $\\lim_{n \\to \\infty} \\frac{2(n+1)}{n^2}$?","hint":"Divide numerator and denominator by $n^2$ to find the dominant behaviour.","answer":"$\\lim_{n \\to \\infty} \\frac{2(n+1)}{n^2} = 0$, so the series converges by the Ratio Test."}],"caption":"Factorial terms always win: exponential/polynomial ÷ factorial → 0. Memorize this pattern for GATE."}
```
