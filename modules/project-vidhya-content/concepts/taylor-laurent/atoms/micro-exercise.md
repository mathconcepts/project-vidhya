---
id: taylor-laurent.micro-exercise
concept_id: taylor-laurent
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
estimated_minutes: 2
---

What is the Taylor series of $f(z)=\cos z$ around $z_0=0$?

<details>
<summary>Answer</summary>

$\cos z = 1 - \dfrac{z^2}{2!} + \dfrac{z^4}{4!} - \dfrac{z^6}{6!} + \cdots = \sum_{n=0}^\infty\dfrac{(-1)^nz^{2n}}{(2n)!}$, from $f^{(n)}(0)$ cycling through $1,0,-1,0$.
</details>
