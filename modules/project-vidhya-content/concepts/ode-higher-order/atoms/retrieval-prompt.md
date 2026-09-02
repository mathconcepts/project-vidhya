---
id: ode-higher-order.retrieval-prompt
concept_id: ode-higher-order
atom_type: retrieval_prompt
bloom_level: 3
difficulty: 0.4
exam_ids: ["*"]
estimated_minutes: 1
retention_tags: ["auxiliary-equation", "complex-roots", "ode-higher-order"]
---

Before checking, try to recall from memory: the general solution of $y'''+y'=0$ is:

- **(A)** $y=C_1+C_2\cos x+C_3\sin x$
- **(B)** $y=C_1e^{x}+C_2\cos x+C_3\sin x$
- **(C)** $y=(C_1+C_2x)\cos x+C_3\sin x$
- **(D)** $y=C_1+C_2x+C_3x^2$

<details>
<summary>Answer</summary>

**A**. Auxiliary equation $r^3+r=0$ factors as $r(r^2+1)=0$, giving roots $r=0,\,\pm i$. The root $r=0$ contributes a plain constant $C_1$ (since $e^{0\cdot x}=1$), and the simple complex pair $\pm i$ (i.e. $\alpha=0,\beta=1$) contributes $C_2\cos x+C_3\sin x$ — no repeated roots here, so no $x$-multiplier anywhere.

</details>
