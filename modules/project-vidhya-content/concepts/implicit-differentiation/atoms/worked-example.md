---
id: implicit-differentiation-worked-example
concept_id: implicit-differentiation
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
---

# Implicit Differentiation — Worked Example

## GATE-Style Problem

> Given the equation $x^2 + xy + y^2 = 7$, find $\dfrac{dy}{dx}$.

---

## Step-by-Step Solution

**Step 1: Differentiate both sides with respect to $x$.**

$$\frac{d}{dx}\!\left[x^2 + xy + y^2\right] = \frac{d}{dx}[7]$$

The right side is a constant: $\dfrac{d}{dx}[7] = 0$.

**Step 2: Differentiate each term on the left.**

**Term $x^2$:** straightforward power rule.
$$\frac{d}{dx}[x^2] = 2x$$

**Term $xy$:** product of $x$ and $y(x)$ — apply the **product rule**.
$$\frac{d}{dx}[xy] = (1)\cdot y + x \cdot \frac{dy}{dx} = y + x\,\frac{dy}{dx}$$

**Term $y^2$:** chain rule (since $y$ depends on $x$).
$$\frac{d}{dx}[y^2] = 2y \cdot \frac{dy}{dx}$$

**Step 3: Assemble the equation.**

$$2x + y + x\,\frac{dy}{dx} + 2y\,\frac{dy}{dx} = 0$$

**Step 4: Collect $\dfrac{dy}{dx}$ terms on one side.**

$$x\,\frac{dy}{dx} + 2y\,\frac{dy}{dx} = -2x - y$$

$$\frac{dy}{dx}(x + 2y) = -(2x + y)$$

**Step 5: Solve for $\dfrac{dy}{dx}$.**

$$\boxed{\frac{dy}{dx} = -\frac{2x + y}{x + 2y}}$$

---

## Verification at a Known Point

Check that $(2, 1)$ lies on the curve: $4 + 2 + 1 = 7$. ✓

At $(2, 1)$:

$$\frac{dy}{dx} = -\frac{2(2) + 1}{2 + 2(1)} = -\frac{5}{4}$$

The tangent slope at $(2, 1)$ is $-5/4$.

---

## GATE Variant

> **Alternate problem:** Find $\dfrac{dy}{dx}$ for $x^3 + y^3 = 6xy$.

This is the **Folium of Descartes**. Differentiating both sides:

$$3x^2 + 3y^2\,\frac{dy}{dx} = 6\!\left(y + x\,\frac{dy}{dx}\right)$$

$$3x^2 + 3y^2\,y' = 6y + 6x\,y'$$

$$y'(3y^2 - 6x) = 6y - 3x^2$$

$$\boxed{\frac{dy}{dx} = \frac{6y - 3x^2}{3y^2 - 6x} = \frac{2y - x^2}{y^2 - 2x}}$$

> **Common GATE error:** Forgetting the chain rule factor $dy/dx$ when differentiating $y^3 \to 3y^2$ (instead of $3y^2 \cdot dy/dx$). This yields a wrong constant instead of a correct expression.

---

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: implicit differentiation of x² + xy + y² = 7","steps":[{"prompt":"For x² + xy + y² = 7, what does d/dx[y²] equal? Remember that y depends on x.","hint":"Apply the chain rule: d/dx[y²] = d/dy[y²] × dy/dx.","answer":"2y · (dy/dx)"},{"prompt":"What does d/dx[xy] equal? This is a product of x and y(x).","hint":"Use the product rule with u=x and v=y. The derivative of x is 1, the derivative of y is dy/dx.","answer":"y + x·(dy/dx)"},{"prompt":"After differentiating all three terms and setting equal to 0, what equation do you get?","hint":"Differentiate term by term: d/dx[x²]=2x, d/dx[xy]=y+x·y', d/dx[y²]=2y·y', and right side=0.","answer":"2x + y + x·(dy/dx) + 2y·(dy/dx) = 0"},{"prompt":"Collect the dy/dx terms and solve. What is the final answer?","hint":"Group x·(dy/dx) + 2y·(dy/dx) on the left, move 2x+y to the right, then factor and divide.","answer":"dy/dx = -(2x + y) / (x + 2y)"}]}
```
