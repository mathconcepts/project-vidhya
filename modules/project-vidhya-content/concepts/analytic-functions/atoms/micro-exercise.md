---
id: analytic-functions.micro-exercise
concept_id: analytic-functions
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
estimated_minutes: 2
---

Which of $f(z)=\bar z$, $f(z)=|z|^2$, $f(z)=e^z$, $f(z)=\operatorname{Re}(z)$ is analytic everywhere in $\mathbb{C}$?

<details>
<summary>Answer</summary>

$f(z)=e^z$. Writing $e^z=e^x\cos y+ie^x\sin y$: $u_x=e^x\cos y=v_y$ ✓ and $u_y=-e^x\sin y=-v_x$ ✓, everywhere. The other three each fail CR except possibly at isolated points ($\bar z$: $u_x=1\neq v_y=-1$; $|z|^2$: fails off the origin; $\operatorname{Re}(z)$: $u_x=1\neq v_y=0$).
</details>
