---
id: complex-integration.micro-exercise
concept_id: complex-integration
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
estimated_minutes: 2
---

Evaluate $\oint_C e^z \, dz$ where $C$ is the circle $|z| = 1$ traversed counterclockwise.

- **(A)** $2\pi i$
- **(B)** $0$
- **(C)** $2\pi$
- **(D)** $1$

<details>
<summary>Answer</summary>

**B**. The function $e^z$ is analytic everywhere in the complex plane (it has no singularities or poles). By Cauchy's integral theorem, the line integral of an analytic function around any closed contour is zero.
Therefore, $\oint_C e^z \, dz = 0$.

</details>
