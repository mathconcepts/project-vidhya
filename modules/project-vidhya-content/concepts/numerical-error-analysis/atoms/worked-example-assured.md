---
# Alternative body for numerical-error-analysis.worked_example, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: numerical-error-analysis.worked-example.assured
concept_id: numerical-error-analysis
atom_type: worked_example
bloom_level: 3
difficulty: 0.2
exam_ids: ["*"]
scaffold_fade: true
variant_of: numerical-error-analysis.worked-example
for_stance: assured
---

## Confirm the linearisation holds, then read the numbers off

Every rule used below is first-order: valid because $\delta p/p=0.004$ and $\delta q/q\approx0.0024$ are both comfortably small, nowhere near where the differential approximation would need a second check.

$$E_a=0.13,\qquad E_r=0.0052,\qquad E_p=0.52\%\qquad(x_t=25.0,\,x_a=24.87)$$

$$E_a(p+q)=\delta p+\delta q=0.07$$

$$E_r(pq)\approx E_r(p)+E_r(q)\approx0.006439\ \Rightarrow\ E_a(pq)\approx0.66$$

The differential form $d(pq)=p\,dq+q\,dp$ agrees exactly — $12.5(0.02)+8.2(0.05)=0.66$ — because it is the same first-order approximation written a second way, not an independent method confirming the first.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: propagating error through a product","steps":[{"prompt":"p = 12.5 ± 0.05 and q = 8.2 ± 0.02. For a PRODUCT pq, which quantity's errors approximately add — absolute or relative?","hint":"Multiplication/division propagate through RELATIVE error, not absolute error.","answer":"Relative errors approximately add: E_r(pq) ≈ E_r(p) + E_r(q)."},{"prompt":"Compute E_r(p) and E_r(q).","hint":"E_r = absolute error / true (or given) value.","answer":"E_r(p) = 0.05/12.5 = 0.004; E_r(q) = 0.02/8.2 ≈ 0.002439"},{"prompt":"Add them, then convert to an absolute error using pq = 102.5. What is the maximum absolute error in pq?","hint":"E_a(pq) ≈ E_r(pq) × pq.","answer":"E_r(pq) ≈ 0.006439, so E_a(pq) ≈ 0.006439 × 102.5 ≈ 0.66"}],"caption":"For products and quotients, propagate RELATIVE error; for sums and differences, propagate ABSOLUTE error — mixing the two up is the most common mistake in this topic."}
```
