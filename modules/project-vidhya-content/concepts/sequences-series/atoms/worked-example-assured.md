---
id: sequences-series.worked-example-assured
concept_id: sequences-series
atom_type: worked_example
bloom_level: 3
difficulty: 0.4
exam_ids: ["*"]
variant_of: sequences-series.worked-example
for_stance: assured
scaffold_fade: true
---

**Problem:** Find $\displaystyle\sum_{r=1}^{20}\dfrac{1}{r(r+1)}$.

Partial fractions give $\frac{1}{r(r+1)}=\frac1r-\frac1{r+1}$, so the sum collapses: every middle value cancels, leaving

$$\sum_{r=1}^{20}\frac{1}{r(r+1)} = 1-\frac1{21} = \boxed{\frac{20}{21}}$$

**Where students actually lose marks here is the LIMIT, not the split.** The partial-fraction identity itself is routine; the error is misreading how far the cancellation runs. Change the problem slightly: $\displaystyle\sum_{r=1}^{n}\frac{1}{r(r+1)}$ for general $n$ telescopes to $1-\frac{1}{n+1}=\frac{n}{n+1}$ — note the surviving denominator is $n+1$, ONE MORE than the upper limit of the sum, since the last bracket produced is $\left(\frac1n-\frac1{n+1}\right)$. Writing the answer as $\frac{n}{n}$ or stopping the cancellation one step early (leaving $\frac1n-\frac1{n+1}$ un-simplified as if it were the final answer, rather than adding it to the accumulated $1-\frac1n$) are both live JEE traps — worth checking that the surviving index matches the LAST term generated, not the last value of $r$ summed over.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: telescoping a sum of reciprocal products","steps":[{"prompt":"Sum 1/(r(r+1)) for r=1 to 20. Neither the AP sum formula nor the GP sum formula applies here. What technique turns this into a sum you can actually collapse?","hint":"Look at the denominator: it's a product of two consecutive integers. Can 1/(r(r+1)) be split into a difference of two simpler fractions?","answer":"Partial fractions: 1/(r(r+1)) = 1/r - 1/(r+1). Check at r=1: 1/1 - 1/2 = 1/2, matching 1/(1x2) = 1/2."},{"prompt":"Write out the first three terms and the last term of the split sum. What pattern of cancellation do you see?","hint":"Term r is 1/r - 1/(r+1). Term r+1 is 1/(r+1) - 1/(r+2). What do these two terms share?","answer":"(1/1 - 1/2) + (1/2 - 1/3) + (1/3 - 1/4) + ... + (1/20 - 1/21). Each middle value like 1/2 or 1/3 appears once as +1/2 and once as -1/2, cancelling completely."},{"prompt":"After all the cancellation, which two pieces are left, and what is the final sum?","hint":"Only the very first piece of the first term and the very last piece of the last term survive.","answer":"1/1 (from the first term) and -1/21 (from the last term) survive. Sum = 1 - 1/21 = 20/21."}]}
```
