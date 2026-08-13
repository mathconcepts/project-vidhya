---
id: series.worked_example
concept_id: series
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
---

# Worked Example: Ratio Test for Series with Factorials

**Problem (GATE-style):**

Determine whether the series $\displaystyle\sum_{n=1}^{\infty} \frac{n^2 \cdot 2^n}{n!}$ converges or diverges. Justify your answer using an appropriate convergence test.

**Solution:**

**Step 1: Identify the series and choose a test.**

We have $a_n = \frac{n^2 \cdot 2^n}{n!}$. This series features both factorial growth and exponential growth. The **Ratio Test** is ideal because factorials simplify dramatically in ratios.

**Step 2: Set up the Ratio Test.**

The Ratio Test requires:
$$\lim_{n \to \infty} \left| \frac{a_{n+1}}{a_n} \right| = L$$

If $L < 1$, the series converges absolutely. If $L > 1$, it diverges.

**Step 3: Compute the ratio.**

$$\frac{a_{n+1}}{a_n} = \frac{(n+1)^2 \cdot 2^{n+1}}{(n+1)!} \cdot \frac{n!}{n^2 \cdot 2^n}$$

$$= \frac{(n+1)^2 \cdot 2}{n^2 \cdot (n+1)} = \frac{2(n+1)}{n^2}$$

**Step 4: Take the limit.**

$$\lim_{n \to \infty} \frac{2(n+1)}{n^2} = \lim_{n \to \infty} \frac{2n + 2}{n^2} = \lim_{n \to \infty} \left( \frac{2}{n} + \frac{2}{n^2} \right) = 0 < 1$$

**Conclusion:**

Since $\lim_{n \to \infty} \frac{a_{n+1}}{a_n} = 0 < 1$, by the Ratio Test, the series $\displaystyle\sum_{n=1}^{\infty} \frac{n^2 \cdot 2^n}{n!}$ **converges absolutely**.

**Key insight:** Factorials grow faster than any exponential or polynomial. This guarantees convergence whenever a factorial appears in the denominator.

---

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Ratio Test with factorials","steps":[{"prompt":"Step 1: Which convergence test should we use for a series with factorials in the denominator?","hint":"Think about which test simplifies factorial ratios nicely.","answer":"The Ratio Test, because $\\frac{n!}{(n+1)!} = \\frac{1}{n+1}$ simplifies instantly."},{"prompt":"Step 2: Compute $\\frac{a_{n+1}}{a_n}$ where $a_n = \\frac{n^2 \\cdot 2^n}{n!}$.","hint":"Write $(n+1)! = (n+1) \\cdot n!$ and $2^{n+1} = 2 \\cdot 2^n$, then cancel.","answer":"$\\frac{a_{n+1}}{a_n} = \\frac{2(n+1)}{n^2}$"},{"prompt":"Step 3: What is $\\lim_{n \\to \\infty} \\frac{2(n+1)}{n^2}$?","hint":"Divide numerator and denominator by $n^2$ to find the dominant behaviour.","answer":"$\\lim_{n \\to \\infty} \\frac{2(n+1)}{n^2} = 0$, so the series converges by the Ratio Test."}],"caption":"Factorial terms always win: exponential/polynomial ÷ factorial → 0. Memorize this pattern for GATE."}
```
```

---

**Summary for calling script:**

Three atoms have been prepared with the exact content above. They need to be written to:

1.
