---
id: indefinite-integration.retrieval_prompt
concept_id: indefinite-integration
atom_type: retrieval_prompt
bloom_level: 1
difficulty: 0.3
estimated_minutes: 1
exam_ids: ["*"]
---

**Question:** State, in order, the three checks you run on $\int f(x)\,dx$ before writing any working. Then apply the first check to $\int 2x\cos(x^2)\,dx$ and state what it gives.

<details>
<summary>Answer</summary>

**The three checks, in order:**

1. Does the integrand contain a function together with a constant multiple of its own derivative? → substitution.
2. Is it a product of structurally unlike functions (polynomial × log/inverse-trig/trig/exponential) with no such pair? → integration by parts, choosing $u$ by LIATE.
3. Is it a genuine rational function, left over after both of the above are ruled out? → partial fractions (after polynomial division if improper).

**Applying check 1 to $\int 2x\cos(x^2)\,dx$:** the derivative of $x^2$ is $2x$, which is exactly the other factor present. Let $u=x^2$, $du=2x\,dx$:

$$\int 2x\cos(x^2)\,dx = \int \cos u\,du = \sin u + C = \sin(x^2) + C$$

</details>
