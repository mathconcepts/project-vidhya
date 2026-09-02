---
id: analytic-functions.retrieval-prompt
concept_id: analytic-functions
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
estimated_minutes: 3
retention_tags: ["cauchy-riemann", "harmonic-conjugate"]
---

From memory, before checking: if $f=u+iv$ is analytic and $u(x,y)=x^2-y^2$, what is $v(x,y)$, up to a constant?

<details>
<summary>Answer</summary>

$v(x,y)=2xy+C$. From $v_y=u_x=2x$, integrate to get $v=2xy+g(x)$; from $v_x=-u_y=2y$, differentiate to get $g'(x)=0$, so $g(x)=C$. Check: $u+iv=x^2-y^2+i(2xy+C)=z^2+iC$, analytic.
</details>
