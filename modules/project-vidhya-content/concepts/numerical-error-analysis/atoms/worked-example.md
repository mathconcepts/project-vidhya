---
id: numerical-error-analysis.worked-example
concept_id: numerical-error-analysis
atom_type: worked_example
bloom_level: 3
difficulty: 0.2
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** (a) True value $x_t=25.0$, approximation $x_a=24.87$: find $E_a$, $E_r$, $E_p$. (b) $p=12.5\pm0.05$, $q=8.2\pm0.02$: find the maximum absolute error in $p+q$, and the maximum absolute and percentage error in $pq$.

---

**Part (a).** $E_a=|25.0-24.87|=0.13$. $E_r=0.13/25.0=0.0052$. $E_p=0.52\%$.

---

**Part (b), sum.** Absolute errors add for addition: $E_a(p+q)\le0.05+0.02=0.07$ (with $p+q=20.7$).

---

**Part (b), product.** Relative errors add for multiplication: $E_r(p)=0.05/12.5=0.004$, $E_r(q)=0.02/8.2\approx0.002439$. $E_r(pq)\approx0.006439\Rightarrow E_p(pq)\approx0.644\%$. With $pq=102.5$: $E_a(pq)\approx0.006439\times102.5\approx0.66$.

**Cross-check** via $d(pq)=p\,dq+q\,dp$: $12.5(0.02)+8.2(0.05)=0.25+0.41=0.66$ — both methods agree exactly.

$$\boxed{E_a(p+q)=0.07,\quad E_a(pq)\approx0.66,\quad E_p(pq)\approx0.644\%}$$

**Verification:** relative error is the "portable" measure — it's the one that propagates cleanly through multiplication, and errors in a sum never cancel in the worst-case bound, even when the operation is a subtraction.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: propagating error through a product","steps":[{"prompt":"p = 12.5 ± 0.05 and q = 8.2 ± 0.02. For a PRODUCT pq, which quantity's errors approximately add — absolute or relative?","hint":"Multiplication/division propagate through RELATIVE error, not absolute error.","answer":"Relative errors approximately add: E_r(pq) ≈ E_r(p) + E_r(q)."},{"prompt":"Compute E_r(p) and E_r(q).","hint":"E_r = absolute error / true (or given) value.","answer":"E_r(p) = 0.05/12.5 = 0.004; E_r(q) = 0.02/8.2 ≈ 0.002439"},{"prompt":"Add them, then convert to an absolute error using pq = 102.5. What is the maximum absolute error in pq?","hint":"E_a(pq) ≈ E_r(pq) × pq.","answer":"E_r(pq) ≈ 0.006439, so E_a(pq) ≈ 0.006439 × 102.5 ≈ 0.66"}],"caption":"For products and quotients, propagate RELATIVE error; for sums and differences, propagate ABSOLUTE error — mixing the two up is the most common mistake in this topic."}
```
