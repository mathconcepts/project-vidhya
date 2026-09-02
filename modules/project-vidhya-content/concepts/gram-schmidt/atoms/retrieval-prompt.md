---
id: gram-schmidt.retrieval-prompt
concept_id: gram-schmidt
atom_type: retrieval_prompt
bloom_level: 1
difficulty: 0.3
estimated_minutes: 1
exam_ids: ["*"]
retention_tags: ["projection", "orthogonalization"]
---

From memory, before checking: what exactly do you subtract from $v_2$ to build $u_2$ orthogonal to $u_1$?

<details>
<summary>Answer</summary>

The projection of $v_2$ onto $u_1$: $u_2 = v_2 - \dfrac{\langle v_2,u_1\rangle}{\langle u_1,u_1\rangle}\,u_1$. Subtracting exactly this — not an approximation — is what guarantees $\langle u_1,u_2\rangle=0$.

</details>
