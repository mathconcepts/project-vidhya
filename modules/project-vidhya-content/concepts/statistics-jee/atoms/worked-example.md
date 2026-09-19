---
id: statistics-jee.worked-example
concept_id: statistics-jee
atom_type: worked_example
bloom_level: 3
difficulty: 0.45
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** Find the mean, variance, and standard deviation of the grouped data below, using the step-deviation method.

| Class | $0$–$10$ | $10$–$20$ | $20$–$30$ | $30$–$40$ | $40$–$50$ |
|---|---|---|---|---|---|
| Frequency ($f$) | $5$ | $8$ | $15$ | $16$ | $6$ |

---

**Step 1 — Replace each class with its midpoint.** Grouped data must be summarised by the class MIDPOINT, not an endpoint: $5,15,25,35,45$, with $N=5+8+15+16+6=50$.

---

**Step 2 — Choose an assumed mean $A$ and class width $h$, and compute $u_i=\dfrac{x_i-A}{h}$.** Pick $A=25$ (the middle class's midpoint) and $h=10$, so $u_i=\dfrac{x_i-25}{10}$ gives $-2,-1,0,1,2$ — small integers, easy to work with.

| $x_i$ | $5$ | $15$ | $25$ | $35$ | $45$ |
|---|---|---|---|---|---|
| $f_i$ | $5$ | $8$ | $15$ | $16$ | $6$ |
| $u_i$ | $-2$ | $-1$ | $0$ | $1$ | $2$ |
| $f_iu_i$ | $-10$ | $-8$ | $0$ | $16$ | $12$ |
| $f_iu_i^2$ | $20$ | $8$ | $0$ | $16$ | $24$ |

---

**Step 3 — Sum the last two rows.** $\sum f_iu_i=-10-8+0+16+12=10$. $\sum f_iu_i^2=20+8+0+16+24=68$.

---

**Step 4 — Compute the mean.**

$$\bar x=A+\frac{\sum f_iu_i}{N}h=25+\frac{10}{50}\times10=25+2=27$$

---

**Step 5 — Compute the variance and standard deviation.**

$$\sigma^2=h^2\left[\frac{\sum f_iu_i^2}{N}-\left(\frac{\sum f_iu_i}{N}\right)^2\right]=100\left[\frac{68}{50}-\left(\frac{10}{50}\right)^2\right]=100\big[1.36-0.04\big]=100(1.32)=132$$

$$\sigma=\sqrt{132}\approx11.49$$

$$\boxed{\bar x=27,\ \ \sigma^2=132,\ \ \sigma\approx11.49}$$

**Check, computed directly (no shortcut) to confirm.** Direct mean: $\dfrac{5(5)+8(15)+15(25)+16(35)+6(45)}{50}=\dfrac{1350}{50}=27$ — matches. Direct variance using deviations from $27$: $\dfrac{5(22^2)+8(12^2)+15(2^2)+16(8^2)+6(18^2)}{50}=\dfrac{2420+1152+60+1024+1944}{50}=\dfrac{6600}{50}=132$ — matches exactly.

**JEE tip.** The coefficient of variation here is $\text{CV}=\dfrac{11.49}{27}\times100\approx42.6\%$ — a genuinely large spread relative to the mean, which is worth stating in a question that also asks you to comment on consistency.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: grouped-data variance by step-deviation","steps":[{"prompt":"Before computing anything, what number replaces each class interval like 0-10 in the calculation, and why not the class boundary 0 or 10?","hint":"Grouped data is always summarised by one representative value per class.","answer":"The class MIDPOINT: 5, 15, 25, 35, 45 for the five classes. Using an endpoint instead of the midpoint would misrepresent every observation inside that class."},{"prompt":"With assumed mean A=25 and class width h=10, what are the u_i values, and what is the actual mean of the data?","hint":"u_i = (x_i - A)/h. Then mean = A + (sum of f*u / N) * h.","answer":"u_i values: -2, -1, 0, 1, 2. Sum of f*u = -10-8+0+16+12 = 10. Mean = 25 + (10/50)*10 = 25 + 2 = 27."},{"prompt":"Given sum of f*u^2 = 68 and N = 50, what is the variance, and what is the standard deviation?","hint":"variance = h^2 * [sum(f*u^2)/N - (sum(f*u)/N)^2].","answer":"variance = 100 * [68/50 - (10/50)^2] = 100 * [1.36 - 0.04] = 132. Standard deviation = sqrt(132) is approximately 11.49."}]}
```
