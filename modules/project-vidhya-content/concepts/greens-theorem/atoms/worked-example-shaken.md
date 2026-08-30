---
# Alternative body for greens-theorem.worked-example, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: greens-theorem.worked_example.shaken
concept_id: greens-theorem
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
variant_of: greens-theorem.worked-example
for_stance: shaken
---

$P=2xy+x^2,\ Q=x^2+y^2$, boundary of the region between $y=x^2$ and $y=2x$, counterclockwise — a closed curve, so Green applies. $\partial Q/\partial x=2x$. $\partial P/\partial y=2x$. Subtract: $2x-2x=0$. The double integral of $0$ over any region is $0$, regardless of the region's shape, so $\oint_C(2xy+x^2)\,dx+(x^2+y^2)\,dy=0$ without ever finding where the two curves cross.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Green's Theorem circulation integral","steps":[{"prompt":"Step 1: What are P and Q from the line integral form?","hint":"Look at the coefficients of dx and dy in the original integral.","answer":"P = 2xy + x² and Q = x² + y²"},{"prompt":"Step 2: What is ∂Q/∂x?","hint":"Take the partial derivative of x² + y² with respect to x.","answer":"∂Q/∂x = 2x"},{"prompt":"Step 3: What is ∂P/∂y?","hint":"Take the partial derivative of 2xy + x² with respect to y.","answer":"∂P/∂y = 2x"},{"prompt":"Step 4: What is (∂Q/∂x) - (∂P/∂y) and why does this matter?","hint":"Subtract the result from Step 3 from Step 2. What does this tell you about the field?","answer":"0. The curl is zero everywhere, meaning the field is conservative and circulation is always zero."}],"caption":"Green's Theorem converts boundary circulation to interior curl—when curl is zero, circulation vanishes."}
```
