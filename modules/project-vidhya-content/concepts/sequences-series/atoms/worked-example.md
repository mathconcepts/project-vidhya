---
id: sequences-series.worked-example
concept_id: sequences-series
atom_type: worked_example
bloom_level: 3
difficulty: 0.4
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** Find $\displaystyle\sum_{r=1}^{20}\dfrac{1}{r(r+1)}$.

---

**Step 1 — Recognise this is not an AP or GP sum.** The terms $\frac{1}{1\cdot2},\frac{1}{2\cdot3},\frac{1}{3\cdot4},\dots$ have no constant difference and no constant ratio, so neither standard sum formula applies. The shape $\frac{1}{r(r+1)}$ — a product of consecutive integers in the denominator — is the signal to try a partial-fraction split instead.

---

**Step 2 — Split into a telescoping form.** Using partial fractions,

$$\frac{1}{r(r+1)} = \frac{1}{r}-\frac{1}{r+1}$$

(Check for $r=1$: $\frac11-\frac12=\frac12$, and $\frac{1}{1\cdot2}=\frac12$ — matches.)

---

**Step 3 — Write out the sum and watch it collapse.**

$$\sum_{r=1}^{20}\left(\frac1r-\frac1{r+1}\right) = \left(\frac11-\frac12\right)+\left(\frac12-\frac13\right)+\left(\frac13-\frac14\right)+\cdots+\left(\frac1{20}-\frac1{21}\right)$$

Every middle term appears once with a $+$ and once with a $-$, so it cancels. Only the very first piece, $\frac11$, and the very last piece, $-\frac1{21}$, survive.

---

**Step 4 — Read off the answer.**

$$\sum_{r=1}^{20}\frac{1}{r(r+1)} = 1-\frac{1}{21} = \boxed{\dfrac{20}{21}}$$

**Check:** the sum of $20$ positive terms, each less than $\frac{1}{1\cdot2}=\frac12$, must land somewhere below $1$ but not too far below it — $\frac{20}{21}\approx0.952$ fits.

**JEE tip.** The number of terms tells you where the cancellation stops. Twenty terms, running from $r=1$ to $r=20$, leaves $f(1)$ and $-f(21)$ standing — the second index is always ONE MORE than the last value of $r$, since each term's "next piece" is $f(r+1)$.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: telescoping a sum of reciprocal products","steps":[{"prompt":"Sum 1/(r(r+1)) for r=1 to 20. Neither the AP sum formula nor the GP sum formula applies here. What technique turns this into a sum you can actually collapse?","hint":"Look at the denominator: it's a product of two consecutive integers. Can 1/(r(r+1)) be split into a difference of two simpler fractions?","answer":"Partial fractions: 1/(r(r+1)) = 1/r - 1/(r+1). Check at r=1: 1/1 - 1/2 = 1/2, matching 1/(1x2) = 1/2."},{"prompt":"Write out the first three terms and the last term of the split sum. What pattern of cancellation do you see?","hint":"Term r is 1/r - 1/(r+1). Term r+1 is 1/(r+1) - 1/(r+2). What do these two terms share?","answer":"(1/1 - 1/2) + (1/2 - 1/3) + (1/3 - 1/4) + ... + (1/20 - 1/21). Each middle value like 1/2 or 1/3 appears once as +1/2 and once as -1/2, cancelling completely."},{"prompt":"After all the cancellation, which two pieces are left, and what is the final sum?","hint":"Only the very first piece of the first term and the very last piece of the last term survive.","answer":"1/1 (from the first term) and -1/21 (from the last term) survive. Sum = 1 - 1/21 = 20/21."}]}
```
