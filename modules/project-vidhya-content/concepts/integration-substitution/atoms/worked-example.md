---
id: integration-substitution.worked-example
concept_id: integration-substitution
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
---

## Worked Example: Power Rule via Substitution

**Problem:**
Evaluate $$\int x(x^2 + 1)^5 \, dx$$

**Solution:**

**Step 1: Identify the structure**
Notice that the integrand has $(x^2+1)^5$ and a factor of $x$ in front. The derivative of $x^2+1$ is $2x$, which is close to our $x$ factor.

**Step 2: Choose the substitution**
Let $u = x^2 + 1$

Then $du = 2x \, dx$, so $x \, dx = \frac{1}{2} du$

**Step 3: Rewrite the integral**
$$\int x(x^2 + 1)^5 \, dx = \int u^5 \cdot \frac{1}{2} \, du = \frac{1}{2} \int u^5 \, du$$

**Step 4: Integrate**
$$\frac{1}{2} \int u^5 \, du = \frac{1}{2} \cdot \frac{u^6}{6} + C = \frac{u^6}{12} + C$$

**Step 5: Substitute back**
$$\frac{(x^2+1)^6}{12} + C$$

**Verification:** Differentiate: $\frac{d}{dx}\left[\frac{(x^2+1)^6}{12}\right] = \frac{1}{12} \cdot 6(x^2+1)^5 \cdot 2x = x(x^2+1)^5$ ✓

---

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Integrate x(x²+1)⁵","steps":[{"prompt":"Step 1: What should u equal to simplify this integral?","hint":"Look for the composite function—what's inside the power of 5?","answer":"u = x² + 1"},{"prompt":"Step 2: Find du in terms of dx.","hint":"Differentiate your choice of u.","answer":"du = 2x dx, so x dx = (1/2) du"},{"prompt":"Step 3: Rewrite the integral in terms of u only.","hint":"Substitute u and (1/2) du, and simplify.","answer":"∫ u⁵ · (1/2) du = (1/2) ∫ u⁵ du"},{"prompt":"Step 4: Integrate using the power rule.","hint":"Apply ∫ uⁿ du = u^(n+1)/(n+1) + C","answer":"(1/2) · u⁶/6 + C = u⁶/12 + C"},{"prompt":"Step 5: Substitute u back to get the final answer.","hint":"Replace u with x² + 1.","answer":"(x² + 1)⁶/12 + C"}],"caption":"The substitution u = x² + 1 transforms a complex-looking integral into a simple power-rule application. Always check: does the derivative of the inner function appear in the integrand?"}
```
