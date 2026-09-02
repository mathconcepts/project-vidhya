---
# Alternative body for integration-substitution.worked_example, served when
# the learner stance is `shaken`. The base file is what a steady student
# reads. See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: integration-substitution.worked_example.shaken
concept_id: integration-substitution
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
variant_of: integration-substitution.worked-example
for_stance: shaken
---

**Given:** $\int x(x^2+1)^5\,dx$.

**Step 1.** Let $u=x^2+1$.

**Step 2.** Then $du=2x\,dx$, so $x\,dx=\frac12du$.

**Step 3.** Rewrite: $\int u^5\cdot\frac12du=\frac12\int u^5du$.

**Step 4.** Integrate: $\frac12\cdot\frac{u^6}{6}=\frac{u^6}{12}$.

**Step 5.** Substitute back: $\boxed{\frac{(x^2+1)^6}{12}+C}$.

**Check:** $\frac{d}{dx}\left[\frac{(x^2+1)^6}{12}\right]=\frac{6(x^2+1)^5\cdot2x}{12}=x(x^2+1)^5$.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Integrate x(x²+1)⁵","steps":[{"prompt":"Step 1: What should u equal to simplify this integral?","hint":"Look for the composite function—what's inside the power of 5?","answer":"u = x² + 1"},{"prompt":"Step 2: Find du in terms of dx.","hint":"Differentiate your choice of u.","answer":"du = 2x dx, so x dx = (1/2) du"},{"prompt":"Step 3: Rewrite the integral in terms of u only.","hint":"Substitute u and (1/2) du, and simplify.","answer":"∫ u⁵ · (1/2) du = (1/2) ∫ u⁵ du"},{"prompt":"Step 4: Integrate using the power rule.","hint":"Apply ∫ uⁿ du = u^(n+1)/(n+1) + C","answer":"(1/2) · u⁶/6 + C = u⁶/12 + C"},{"prompt":"Step 5: Substitute u back to get the final answer.","hint":"Replace u with x² + 1.","answer":"(x² + 1)⁶/12 + C"}],"caption":"The substitution u = x² + 1 transforms a complex-looking integral into a simple power-rule application. Always check: does the derivative of the inner function appear in the integrand?"}
```
