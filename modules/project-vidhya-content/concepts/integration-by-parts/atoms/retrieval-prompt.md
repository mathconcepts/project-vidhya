---
id: integration-by-parts.retrieval-prompt
concept_id: integration-by-parts
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
estimated_minutes: 3
---

Evaluate $\int x^2 e^x \, dx$.

- **(A)** $e^x(x^2 - 2x + 2) + C$
- **(B)** $x^2 e^x + C$
- **(C)** $e^x(x^2 - 1) + C$
- **(D)** $2xe^x + C$

<details>
<summary>Answer</summary>

**A**. First application: $u = x^2$, $dv = e^x dx$.

$du = 2x dx$, $v = e^x$

$$\int x^2 e^x \, dx = x^2 e^x - \int 2x e^x \, dx$$

Second application to $\int 2x e^x dx$: $u = 2x$, $dv = e^x dx$.

$$\int 2x e^x \, dx = 2x e^x - \int 2 e^x \, dx = 2x e^x - 2e^x$$

Combine: $\int x^2 e^x \, dx = x^2 e^x - (2x e^x - 2e^x) + C = e^x(x^2 - 2x + 2) + C$

</details>
