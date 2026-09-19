---
id: statistics-jee.worked-example-shaken
concept_id: statistics-jee
atom_type: worked_example
bloom_level: 3
difficulty: 0.45
exam_ids: ["*"]
variant_of: statistics-jee.worked-example
for_stance: shaken
scaffold_fade: true
---

**Problem:** Find the mean, variance, and standard deviation of this grouped data, using the step-deviation method.

| Class | $0$–$10$ | $10$–$20$ | $20$–$30$ | $30$–$40$ | $40$–$50$ |
|---|---|---|---|---|---|
| Frequency ($f$) | $5$ | $8$ | $15$ | $16$ | $6$ |

**Step 1.** Write the midpoint of each class: $5,15,25,35,45$. Add the frequencies: $N=5+8+15+16+6=50$.

**Step 2.** Choose $A=25$ (the middle class's midpoint) and $h=10$. Compute $u_i=\dfrac{x_i-25}{10}$ for each midpoint: $u=-2,-1,0,1,2$.

**Step 3.** Multiply, row by row, and add:

| $x_i$ | $5$ | $15$ | $25$ | $35$ | $45$ |
|---|---|---|---|---|---|
| $f_i$ | $5$ | $8$ | $15$ | $16$ | $6$ |
| $u_i$ | $-2$ | $-1$ | $0$ | $1$ | $2$ |
| $f_iu_i$ | $-10$ | $-8$ | $0$ | $16$ | $12$ |
| $f_iu_i^2$ | $20$ | $8$ | $0$ | $16$ | $24$ |

$\sum f_iu_i=-10-8+0+16+12=10$. $\sum f_iu_i^2=20+8+0+16+24=68$.

**Step 4.** Mean: $\bar x=25+\dfrac{10}{50}\times10=25+2=27$.

**Step 5.** Variance: $\sigma^2=10^2\left[\dfrac{68}{50}-\left(\dfrac{10}{50}\right)^2\right]=100\big[1.36-0.04\big]=132$.

Standard deviation: $\sigma=\sqrt{132}\approx11.49$.

$$\boxed{\bar x=27,\ \ \sigma^2=132,\ \ \sigma\approx11.49}$$

**Check by the direct method (no shortcut).** Deviations from $27$: $-22,-12,-2,8,18$. Squares: $484,144,4,64,324$. Multiply by frequency and add: $2420+1152+60+1024+1944=6600$. Divide by $50$: $132$ — matches Step 5 exactly.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: grouped-data variance by step-deviation","steps":[{"prompt":"Before computing anything, what number replaces each class interval like 0-10 in the calculation, and why not the class boundary 0 or 10?","hint":"Grouped data is always summarised by one representative value per class.","answer":"The class MIDPOINT: 5, 15, 25, 35, 45 for the five classes. Using an endpoint instead of the midpoint would misrepresent every observation inside that class."},{"prompt":"With assumed mean A=25 and class width h=10, what are the u_i values, and what is the actual mean of the data?","hint":"u_i = (x_i - A)/h. Then mean = A + (sum of f*u / N) * h.","answer":"u_i values: -2, -1, 0, 1, 2. Sum of f*u = -10-8+0+16+12 = 10. Mean = 25 + (10/50)*10 = 25 + 2 = 27."},{"prompt":"Given sum of f*u^2 = 68 and N = 50, what is the variance, and what is the standard deviation?","hint":"variance = h^2 * [sum(f*u^2)/N - (sum(f*u)/N)^2].","answer":"variance = 100 * [68/50 - (10/50)^2] = 100 * [1.36 - 0.04] = 132. Standard deviation = sqrt(132) is approximately 11.49."}]}
```
