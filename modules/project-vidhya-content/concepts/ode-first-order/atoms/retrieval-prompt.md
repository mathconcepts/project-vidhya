---
id: ode-first-order.retrieval-prompt
concept_id: ode-first-order
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
estimated_minutes: 3
---

The general solution of $\frac{dy}{dx} + y = e^{-x}$ is:

- **(A)** $y = (x + C)e^{-x}$
- **(B)** $y = e^{-x}(x + C)$
- **(C)** $y = (C - x)e^{-x}$
- **(D)** $y = Ce^{-x} + xe^{-x}$

<details>
<summary>Answer</summary>

**A**. This is a first-order linear ODE of the form $\frac{dy}{dx} + P(x)y = Q(x)$ where $P(x) = 1$ and $Q(x) = e^{-x}$.

**Step 1:** Find the integrating factor.
$$\mu(x) = e^{\int 1 \, dx} = e^x$$

**Step 2:** Multiply both sides by $\mu(x)$.
$$e^x \frac{dy}{dx} + e^x y = e^x \cdot e^{-x} = 1$$

**Step 3:** Recognize the left side as a derivative.
$$\frac{d}{dx}(e^x y) = 1$$

**Step 4:** Integrate both sides.
$$e^x y = x + C$$
$$y = (x + C)e^{-x}$$

Geometrically, this solution decays exponentially (due to the $e^{-x}$ factor) but is modulated by the linear growth $(x + C)$, creating a solution that eventually decays to zero.

</details>
