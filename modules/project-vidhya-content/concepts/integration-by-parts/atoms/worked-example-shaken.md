---
# Alternative body for integration-by-parts.worked_example, served when the
# learner stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: integration-by-parts.worked_example.shaken
concept_id: integration-by-parts
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
variant_of: integration-by-parts.worked_example
for_stance: shaken
---

**Given:** $\int x^2e^x\,dx$.

**Step 1.** LIATE: algebraic before exponential, so $u=x^2$, $dv=e^x dx$.

**Step 2.** Then $du=2x\,dx$, $v=e^x$.

**Step 3.** Apply the formula: $\int x^2e^x\,dx=x^2e^x-2\int xe^x\,dx$.

**Step 4.** The new integral needs by parts again: $u=x$, $dv=e^x dx$, so $du=dx$, $v=e^x$.

**Step 5.** $\int xe^x\,dx=xe^x-e^x$.

**Step 6.** Substitute back: $x^2e^x-2(xe^x-e^x)=e^x(x^2-2x+2)$.

**Answer:** $\boxed{e^x(x^2-2x+2)+C}$.

**Check it:** differentiate: $e^x(x^2-2x+2)+e^x(2x-2)=x^2e^x$. Matches.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Solve: ∫x² eˣ dx using integration by parts (repeated)","steps":[{"prompt":"Step 1: Use LIATE to choose u and dv. What should u be?","hint":"LIATE: Logarithmic, Inverse trig, Algebraic, Trigonometric, Exponential. Which appears first in our integrand x²·eˣ?","answer":"u = x² (algebraic comes before exponential in LIATE)"},{"prompt":"Step 2: If u = x², what is dv and v?","hint":"Once u = x² and du = 2x dx, the remaining part is e^x dx","answer":"dv = e^x dx, so v = e^x"},{"prompt":"Step 3: Write the integration by parts formula: ∫u dv = uv - ∫v du","hint":"Plug in: u = x², v = e^x, du = 2x dx","answer":"∫x² e^x dx = x² e^x - ∫e^x · 2x dx = x² e^x - 2∫x e^x dx"},{"prompt":"Step 4: Now solve ∫x e^x dx using integration by parts again","hint":"Let u = x, dv = e^x dx. Then du = dx, v = e^x. Use the formula.","answer":"∫x e^x dx = x e^x - ∫e^x dx = x e^x - e^x"},{"prompt":"Step 5: Substitute back to get the final answer","hint":"Replace ∫x e^x dx in Step 3's result with (x e^x - e^x)","answer":"∫x² e^x dx = x² e^x - 2(x e^x - e^x) = e^x(x² - 2x + 2) + C"}],"caption":"Key insight: Repeated application of LIATE reduces polynomial degree step-by-step until only exponential/trig remains, which is integrable directly."}
```
