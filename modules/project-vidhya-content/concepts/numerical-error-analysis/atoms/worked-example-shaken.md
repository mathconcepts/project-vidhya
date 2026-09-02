---
# Alternative body for numerical-error-analysis.worked_example, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: numerical-error-analysis.worked-example.shaken
concept_id: numerical-error-analysis
atom_type: worked_example
bloom_level: 3
difficulty: 0.2
exam_ids: ["*"]
scaffold_fade: true
variant_of: numerical-error-analysis.worked-example
for_stance: shaken
---

Done once absolute error, relative error, and percentage error have each been found — that is the entire target for part (a).

$x_t=25.0,\ x_a=24.87$:

$$E_a=|25.0-24.87|=0.13$$

$$E_r=\frac{0.13}{25.0}=0.0052$$

$$E_p=0.0052\times100\%=0.52\%$$

For $p=12.5\pm0.05$ and $q=8.2\pm0.02$: a sum adds absolute errors, so $E_a(p+q)=0.05+0.02=0.07$. A product adds relative errors instead: $E_r(p)=0.004$, $E_r(q)\approx0.002439$, giving $E_r(pq)\approx0.006439$, and since $pq=102.5$, an absolute error of about $0.66$.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: propagating error through a product","steps":[{"prompt":"p = 12.5 ± 0.05 and q = 8.2 ± 0.02. For a PRODUCT pq, which quantity's errors approximately add — absolute or relative?","hint":"Multiplication/division propagate through RELATIVE error, not absolute error.","answer":"Relative errors approximately add: E_r(pq) ≈ E_r(p) + E_r(q)."},{"prompt":"Compute E_r(p) and E_r(q).","hint":"E_r = absolute error / true (or given) value.","answer":"E_r(p) = 0.05/12.5 = 0.004; E_r(q) = 0.02/8.2 ≈ 0.002439"},{"prompt":"Add them, then convert to an absolute error using pq = 102.5. What is the maximum absolute error in pq?","hint":"E_a(pq) ≈ E_r(pq) × pq.","answer":"E_r(pq) ≈ 0.006439, so E_a(pq) ≈ 0.006439 × 102.5 ≈ 0.66"}],"caption":"For products and quotients, propagate RELATIVE error; for sums and differences, propagate ABSOLUTE error — mixing the two up is the most common mistake in this topic."}
```
