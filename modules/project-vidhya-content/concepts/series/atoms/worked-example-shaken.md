---
# Alternative body for series.worked_example, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: series.worked_example.shaken
concept_id: series
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
variant_of: series.worked_example
for_stance: shaken
---

**Given:** does $\sum_{n=1}^\infty\dfrac{n^2\cdot2^n}{n!}$ converge?

**Step 1.** Notice the factorial: use the Ratio Test.

**Step 2.** Write the ratio: $\dfrac{a_{n+1}}{a_n}=\dfrac{(n+1)^2\cdot2^{n+1}}{(n+1)!}\cdot\dfrac{n!}{n^2\cdot2^n}$.

**Step 3.** Cancel $n!$ against $(n+1)!=(n+1)\cdot n!$, and $2^n$ against $2^{n+1}$: $\dfrac{(n+1)^2\cdot2}{n^2\cdot(n+1)}=\dfrac{2(n+1)}{n^2}$.

**Step 4.** Take the limit: $\lim_{n\to\infty}\dfrac{2(n+1)}{n^2}=\lim_{n\to\infty}\left(\dfrac2n+\dfrac2{n^2}\right)=0$.

**Answer:** since the limit is $0<1$, the series converges absolutely.

**Check it:** the terms themselves, $a_1=2$, $a_2=8$, $a_3=12$, $a_4\approx10.7$, grow for a while and then start shrinking — matching a ratio that heads toward $0$.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Ratio Test with factorials","steps":[{"prompt":"Step 1: Which convergence test should we use for a series with factorials in the denominator?","hint":"Think about which test simplifies factorial ratios nicely.","answer":"The Ratio Test, because $\\frac{n!}{(n+1)!} = \\frac{1}{n+1}$ simplifies instantly."},{"prompt":"Step 2: Compute $\\frac{a_{n+1}}{a_n}$ where $a_n = \\frac{n^2 \\cdot 2^n}{n!}$.","hint":"Write $(n+1)! = (n+1) \\cdot n!$ and $2^{n+1} = 2 \\cdot 2^n$, then cancel.","answer":"$\\frac{a_{n+1}}{a_n} = \\frac{2(n+1)}{n^2}$"},{"prompt":"Step 3: What is $\\lim_{n \\to \\infty} \\frac{2(n+1)}{n^2}$?","hint":"Divide numerator and denominator by $n^2$ to find the dominant behaviour.","answer":"$\\lim_{n \\to \\infty} \\frac{2(n+1)}{n^2} = 0$, so the series converges by the Ratio Test."}],"caption":"Factorial terms always win: exponential/polynomial ÷ factorial → 0. Memorize this pattern for GATE."}
```
