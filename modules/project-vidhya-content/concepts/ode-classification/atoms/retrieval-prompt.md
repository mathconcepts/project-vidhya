---
id: ode-classification.retrieval-prompt
concept_id: ode-classification
atom_type: retrieval_prompt
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
estimated_minutes: 1
retention_tags: ["ode-degree-undefined", "ode-order-vs-degree"]
---

Before checking, try to recall: for $y'' + \sin(y') = 0$, what is the degree, and why?

<details>
<summary>Answer</summary>

**Degree is undefined.** The derivative $y'$ sits inside $\sin(\cdot)$, a transcendental function — there is no algebraic manipulation that rewrites $\sin(y')$ as an integer power of $y'$, so the equation is never polynomial in its derivatives. Order is still perfectly well-defined ($=2$, from $y''$); only degree fails to exist here.

</details>
