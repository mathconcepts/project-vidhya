---
id: sequences-series.worked-example-shaken
concept_id: sequences-series
atom_type: worked_example
bloom_level: 3
difficulty: 0.4
exam_ids: ["*"]
variant_of: sequences-series.worked-example
for_stance: shaken
scaffold_fade: true
---

**Problem:** Find $\displaystyle\sum_{r=1}^{20}\dfrac{1}{r(r+1)}$.

**Step 1.** Check for a common difference or common ratio between the terms $\frac{1}{1\cdot2},\frac{1}{2\cdot3},\frac{1}{3\cdot4},\dots$ — there is neither, so the AP and GP sum formulas do not apply here.

**Step 2.** Split each term using partial fractions:

$$\frac{1}{r(r+1)} = \frac{1}{r}-\frac{1}{r+1}$$

Check $r=1$: $\frac11-\frac12=\frac12$. And directly, $\frac{1}{1\times2}=\frac12$. The split is correct.

**Step 3.** Write out the sum term by term:

$$\left(\frac11-\frac12\right)+\left(\frac12-\frac13\right)+\left(\frac13-\frac14\right)+\cdots+\left(\frac1{20}-\frac1{21}\right)$$

Look at $\frac12$: it appears as $+\frac12$ in the first bracket and as $-\frac12$ in the second bracket. The two cancel. The same happens to $\frac13, \frac14,\dots,\frac1{20}$ — every middle value cancels exactly once.

**Step 4.** Only $\frac11$ (from the very first bracket) and $-\frac1{21}$ (from the very last bracket) are left standing:

$$\sum_{r=1}^{20}\frac{1}{r(r+1)} = 1-\frac1{21} = \frac{21}{21}-\frac1{21} = \boxed{\frac{20}{21}}$$

**Check:** $\frac{20}{21}$ is just under $1$, and a sum of $20$ small positive fractions that stays under $1$ is believable.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: telescoping a sum of reciprocal products","steps":[{"prompt":"Sum 1/(r(r+1)) for r=1 to 20. Neither the AP sum formula nor the GP sum formula applies here. What technique turns this into a sum you can actually collapse?","hint":"Look at the denominator: it's a product of two consecutive integers. Can 1/(r(r+1)) be split into a difference of two simpler fractions?","answer":"Partial fractions: 1/(r(r+1)) = 1/r - 1/(r+1). Check at r=1: 1/1 - 1/2 = 1/2, matching 1/(1x2) = 1/2."},{"prompt":"Write out the first three terms and the last term of the split sum. What pattern of cancellation do you see?","hint":"Term r is 1/r - 1/(r+1). Term r+1 is 1/(r+1) - 1/(r+2). What do these two terms share?","answer":"(1/1 - 1/2) + (1/2 - 1/3) + (1/3 - 1/4) + ... + (1/20 - 1/21). Each middle value like 1/2 or 1/3 appears once as +1/2 and once as -1/2, cancelling completely."},{"prompt":"After all the cancellation, which two pieces are left, and what is the final sum?","hint":"Only the very first piece of the first term and the very last piece of the last term survive.","answer":"1/1 (from the first term) and -1/21 (from the last term) survive. Sum = 1 - 1/21 = 20/21."}]}
```
