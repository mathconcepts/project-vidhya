---
id: definite-integration.retrieval_prompt
concept_id: definite-integration
atom_type: retrieval_prompt
bloom_level: 1
difficulty: 0.3
estimated_minutes: 1
exam_ids: ["*"]
---

**Question:** State King's Rule and the odd/even symmetric-interval properties. Then use one of them to evaluate $\displaystyle\int_{-1}^1 x^5\,dx$ without finding an antiderivative.

<details>
<summary>Answer</summary>

**King's Rule:** $\displaystyle\int_a^b f(x)\,dx = \int_a^b f(a+b-x)\,dx$.

**Symmetric-interval properties:** for $\displaystyle\int_{-a}^a f(x)\,dx$ — equals $2\int_0^a f(x)\,dx$ if $f$ is even; equals $0$ if $f$ is odd.

**Applying it to $\displaystyle\int_{-1}^1 x^5\,dx$:** check $f(-x)=(-x)^5=-x^5=-f(x)$, so $x^5$ is odd. The interval $[-1,1]$ is symmetric about $0$, so the integral is $0$ — read directly off the symmetry, with no antiderivative needed.

</details>
