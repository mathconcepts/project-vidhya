---
# Alternative body for integration-substitution.worked-example, served when
# the learner stance is `assured`. The base file is what a steady student
# reads. See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: integration-substitution.worked_example.assured
concept_id: integration-substitution
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
variant_of: integration-substitution.worked-example
for_stance: assured
---

Recognize $x(x^2+1)^5\,dx$ as $g'(x)$-adjacent times $g(x)^5$ directly: $g(x)=x^2+1$, $g'(x)=2x$, and the integrand carries $x$, a factor of $\frac12$ off from $g'$. Scale for the mismatch and apply the pattern in one line: $\int x(x^2+1)^5\,dx=\frac12\cdot\frac{(x^2+1)^6}{6}+C=\frac{(x^2+1)^6}{12}+C$.

**Answer:** $\boxed{\dfrac{(x^2+1)^6}{12}+C}$, confirmed by differentiating back to $x(x^2+1)^5$.

The distinction that costs marks: this shortcut only works when the *entire* integrand consists of a composition and a constant multiple of its exact derivative. $\int(x^2+1)^5\,dx$ alone, without the $x$ factor, is not this pattern at all — the power cannot simply be integrated by the same substitution, since no leftover factor supplies $du$. That integral needs a genuinely different route (expansion, or a different substitution entirely), and mistaking "looks similar" for "is the same pattern" is the error this concept exists to prevent.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Integrate x(x²+1)⁵","steps":[{"prompt":"Step 1: What should u equal to simplify this integral?","hint":"Look for the composite function—what's inside the power of 5?","answer":"u = x² + 1"},{"prompt":"Step 2: Find du in terms of dx.","hint":"Differentiate your choice of u.","answer":"du = 2x dx, so x dx = (1/2) du"},{"prompt":"Step 3: Rewrite the integral in terms of u only.","hint":"Substitute u and (1/2) du, and simplify.","answer":"∫ u⁵ · (1/2) du = (1/2) ∫ u⁵ du"},{"prompt":"Step 4: Integrate using the power rule.","hint":"Apply ∫ uⁿ du = u^(n+1)/(n+1) + C","answer":"(1/2) · u⁶/6 + C = u⁶/12 + C"},{"prompt":"Step 5: Substitute u back to get the final answer.","hint":"Replace u with x² + 1.","answer":"(x² + 1)⁶/12 + C"}],"caption":"The substitution u = x² + 1 transforms a complex-looking integral into a simple power-rule application. Always check: does the derivative of the inner function appear in the integrand?"}
```
