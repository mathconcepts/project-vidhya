---
id: integration-basics.worked_example
concept_id: integration-basics
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
---

# Worked Example: Integrating Polynomial and Exponential Terms

**Problem (GATE-style):**

Find $\int (3x^2 + 4\sin x - e^x) \, dx$.

**Solution:**

We use linearity of integration: $\int [f(x) + g(x)] \, dx = \int f(x) \, dx + \int g(x) \, dx$.

Breaking into three terms:

$$\int 3x^2 \, dx + \int 4\sin x \, dx - \int e^x \, dx$$

**Term 1:** Apply power rule with $n = 2$:
$$\int 3x^2 \, dx = 3 \cdot \frac{x^{2+1}}{2+1} = 3 \cdot \frac{x^3}{3} = x^3$$

**Term 2:** Use the sine antiderivative:
$$\int 4\sin x \, dx = 4 \cdot (-\cos x) = -4\cos x$$

**Term 3:** Exponential antiderivative:
$$\int e^x \, dx = e^x$$

**Final Answer:**
$$\boxed{\int (3x^2 + 4\sin x - e^x) \, dx = x^3 - 4\cos x - e^x + C}$$

**Verification:** Differentiate the result:
$$\frac{d}{dx}[x^3 - 4\cos x - e^x + C] = 3x^2 + 4\sin x - e^x \,\checkmark$$

---

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Find the antiderivative of a polynomial","steps":[{"prompt":"Step 1: Rewrite the integral using linearity. Separate $\\int (3x^2 + 4\\sin x - e^x) dx$ into three independent integrals.","hint":"Linearity means: $\\int [f(x) + g(x)] dx = \\int f(x) dx + \\int g(x) dx$. Handle the minus sign as adding a negative.","answer":"$\\int 3x^2 dx + \\int 4\\sin x dx - \\int e^x dx$"},{"prompt":"Step 2: For the first term, apply the power rule: $\\int x^n dx = \\frac{x^{n+1}}{n+1} + C$. What is $\\int 3x^2 dx$?","hint":"Power rule with $n=2$ gives $\\frac{x^3}{3}$. Don't forget the coefficient 3 in front.","answer":"$3 \\cdot \\frac{x^3}{3} = x^3$"},{"prompt":"Step 3: For the remaining two terms, recall: $\\int \\sin x dx = -\\cos x + C$ and $\\int e^x dx = e^x + C$. Combine all three antiderivatives into one expression.","hint":"Don't drop the constant of integration $C$ at the very end. The sign before $e^x$ is negative because we had $-\\int e^x dx$.","answer":"$x^3 - 4\\cos x - e^x + C$"}],"caption":"Key exam insight: Always split complex integrands by linearity, apply known formulas term-by-term, and verify by differentiating."}
```
