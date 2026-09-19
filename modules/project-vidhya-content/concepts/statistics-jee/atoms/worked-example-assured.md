---
id: statistics-jee.worked-example-assured
concept_id: statistics-jee
atom_type: worked_example
bloom_level: 3
difficulty: 0.45
exam_ids: ["*"]
variant_of: statistics-jee.worked-example
for_stance: assured
scaffold_fade: true
---

**Problem:** Find the mean, variance, and standard deviation of this grouped data.

| Class | $0$–$10$ | $10$–$20$ | $20$–$30$ | $30$–$40$ | $40$–$50$ |
|---|---|---|---|---|---|
| Frequency ($f$) | $5$ | $8$ | $15$ | $16$ | $6$ |

Midpoints $5,15,25,35,45$; step-deviation with $A=25,h=10$ gives $u=-2,-1,0,1,2$, $\sum f_iu_i=10$, $\sum f_iu_i^2=68$, $N=50$. So $\bar x=25+\frac{10}{50}(10)=27$, $\sigma^2=100\left[\frac{68}{50}-\left(\frac{10}{50}\right)^2\right]=132$, $\sigma\approx11.49$.

**The choice of $A$ never affects the final variance — only the arithmetic's difficulty.** Redo this with $A=15$ instead of $25$: $u_i=-1,0,1,2,3$, $\sum f_iu_i=8(0)+15(1)+16(2)+6(3)+5(-1)=0+15+32+18-5=60$, mean $=15+\frac{60}{50}(10)=15+12=27$ — the mean, computed by an entirely different assumed mean, still comes out $27$. Variance likewise lands at the same $132$ regardless of which $A$ was chosen; a different $A$ only changes how large the intermediate $u_i$ and $f_iu_i^2$ values get, never the final answer. Picking $A$ badly (say, an extreme class rather than a central one) costs time, not correctness.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: grouped-data variance by step-deviation","steps":[{"prompt":"Before computing anything, what number replaces each class interval like 0-10 in the calculation, and why not the class boundary 0 or 10?","hint":"Grouped data is always summarised by one representative value per class.","answer":"The class MIDPOINT: 5, 15, 25, 35, 45 for the five classes. Using an endpoint instead of the midpoint would misrepresent every observation inside that class."},{"prompt":"With assumed mean A=25 and class width h=10, what are the u_i values, and what is the actual mean of the data?","hint":"u_i = (x_i - A)/h. Then mean = A + (sum of f*u / N) * h.","answer":"u_i values: -2, -1, 0, 1, 2. Sum of f*u = -10-8+0+16+12 = 10. Mean = 25 + (10/50)*10 = 25 + 2 = 27."},{"prompt":"Given sum of f*u^2 = 68 and N = 50, what is the variance, and what is the standard deviation?","hint":"variance = h^2 * [sum(f*u^2)/N - (sum(f*u)/N)^2].","answer":"variance = 100 * [68/50 - (10/50)^2] = 100 * [1.36 - 0.04] = 132. Standard deviation = sqrt(132) is approximately 11.49."}]}
```
