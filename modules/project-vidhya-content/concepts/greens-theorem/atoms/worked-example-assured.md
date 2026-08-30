---
# Alternative body for greens-theorem.worked-example, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: greens-theorem.worked_example.assured
concept_id: greens-theorem
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
variant_of: greens-theorem.worked-example
for_stance: assured
---

$P=2xy+x^2,\,Q=x^2+y^2$: $\partial Q/\partial x-\partial P/\partial y=2x-2x=0$ identically, so the integrand of the double integral is zero at every point of the plane — meaning $\oint_C P\,dx+Q\,dy=0$ for any closed, positively oriented curve $C$, not only the one bounded by $y=x^2$ and $y=2x$. Recognizing that $\partial Q/\partial x\equiv\partial P/\partial y$ makes $\mathbf F$ conservative is worth more than grinding through the region's limits: once spotted, the double integral is skippable entirely.

The one check not to skip: Green's theorem needs $C$ actually closed and traversed positively before any of this applies. A curve that ends where it starts but crosses itself, or one only piecewise matching the stated boundary, is not the hypothesis this shortcut assumes — verify the curve first, then use the zero.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Green's Theorem circulation integral","steps":[{"prompt":"Step 1: What are P and Q from the line integral form?","hint":"Look at the coefficients of dx and dy in the original integral.","answer":"P = 2xy + x² and Q = x² + y²"},{"prompt":"Step 2: What is ∂Q/∂x?","hint":"Take the partial derivative of x² + y² with respect to x.","answer":"∂Q/∂x = 2x"},{"prompt":"Step 3: What is ∂P/∂y?","hint":"Take the partial derivative of 2xy + x² with respect to y.","answer":"∂P/∂y = 2x"},{"prompt":"Step 4: What is (∂Q/∂x) - (∂P/∂y) and why does this matter?","hint":"Subtract the result from Step 3 from Step 2. What does this tell you about the field?","answer":"0. The curl is zero everywhere, meaning the field is conservative and circulation is always zero."}],"caption":"Green's Theorem converts boundary circulation to interior curl—when curl is zero, circulation vanishes."}
```
