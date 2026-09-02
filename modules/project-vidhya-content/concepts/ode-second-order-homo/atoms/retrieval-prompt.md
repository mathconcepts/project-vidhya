---
id: ode-second-order-homo.retrieval-prompt
concept_id: ode-second-order-homo
atom_type: retrieval_prompt
bloom_level: 3
difficulty: 0.3
exam_ids: ["*"]
estimated_minutes: 1
retention_tags: ["characteristic-equation", "distinct-real-roots", "ode-second-order-homo"]
---

Before checking, try to recall from memory: the general solution of $y''-y'-6y=0$ is:

- **(A)** $y=C_1e^{3x}+C_2e^{-2x}$
- **(B)** $y=C_1e^{-3x}+C_2e^{2x}$
- **(C)** $y=(C_1+C_2x)e^{3x}$
- **(D)** $y=C_1\cos3x+C_2\sin2x$

<details>
<summary>Answer</summary>

**A**. Characteristic equation $r^2-r-6=0$ factors as $(r-3)(r+2)=0$, giving distinct real roots $r=3,-2$. Two distinct real roots always give a sum of two plain exponentials — no repeated-root $x$ factor, no trig, since the discriminant $(-1)^2-4(1)(-6)=25>0$ rules both of those out.

</details>
