---
id: ode-exact.retrieval-prompt
concept_id: ode-exact
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
estimated_minutes: 3
---

Continuing the above problem, differentiate $F(x, y) = x^3 + 2xy + g(y)$ with respect to $y$ and compare with $N(x, y) = 2x + 4y^3$ to find $g(y)$.

- **(A)** $g(y) = 4y^3$
- **(B)** $g(y) = y^4$
- **(C)** $g(y) = 4y^4$
- **(D)** $g(y) = y^3 + C$

<details>
<summary>Answer</summary>

**B**. **Step 1:** Differentiate $F(x, y) = x^3 + 2xy + g(y)$ with respect to $y$:
$$\frac{\partial F}{\partial y} = 0 + 2x + g'(y) = 2x + g'(y)$$

**Step 2:** Set this equal to $N(x, y) = 2x + 4y^3$:
$$2x + g'(y) = 2x + 4y^3$$

**Step 3:** Solve for $g'(y)$:
$$g'(y) = 4y^3$$

**Step 4:** Integrate to find $g(y)$:
$$g(y) = \int 4y^3 \, dy = y^4 + C_0$$

We can set $C_0 = 0$ (absorb it into the final constant). So $g(y) = y^4$.

</details>
