---
id: ode-second-order-nonhomo.retrieval-prompt
concept_id: ode-second-order-nonhomo
atom_type: retrieval_prompt
bloom_level: 3
difficulty: 0.35
exam_ids: ["*"]
estimated_minutes: 1
retention_tags: ["resonance", "undetermined-coefficients", "ode-second-order-nonhomo"]
---

Before checking, try to recall from memory: the particular solution of $y''+y=\cos x$ has the form:

- **(A)** $A\cos x+B\sin x$
- **(B)** $x(A\cos x+B\sin x)$
- **(C)** $Ax^2\cos x$
- **(D)** $A\cos x$

<details>
<summary>Answer</summary>

**B**. The homogeneous solutions of $y''+y=0$ are $\cos x,\sin x$ — exactly the family $\cos x$ belongs to, so plain form (A) collapses to $0$ under substitution. Multiplying by $x$ (form B) restores a solvable equation; substituting $y_p=x(A\cos x+B\sin x)$ gives $A=0,\,B=\tfrac12$, so $y_p=\tfrac{x}{2}\sin x$.

</details>
