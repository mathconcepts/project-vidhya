---
id: rotational-mechanics.micro-exercise
concept_id: rotational-mechanics
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.4
estimated_minutes: 2
exam_ids: ["*"]
---

A thin rod has moment of inertia $I_{cm}=3\text{ kg·m}^2$ about an axis through its centre. Its mass is $M=6\text{ kg}$. What is its moment of inertia about a parallel axis $d=1\text{ m}$ away from the centre?

A) $3\text{ kg·m}^2$
B) $6\text{ kg·m}^2$
C) $9\text{ kg·m}^2$
D) $12\text{ kg·m}^2$
E) Cannot be found without knowing the rod's length

<details>
<summary>Answer</summary>

**Correct answer: C) $9\text{ kg·m}^2$.**

Parallel axis theorem: $I=I_{cm}+Md^2 = 3 + (6)(1)^2 = 3+6=9\text{ kg·m}^2$.

**Why the others fail:**
- A) $3\text{ kg·m}^2$ forgets to add anything at all — it is just $I_{cm}$, valid only at the centre-of-mass axis, not the shifted one.
- B) $6\text{ kg·m}^2$ is only the added term $Md^2$, dropped the original $I_{cm}$.
- D) $12\text{ kg·m}^2$ comes from doubling $Md^2$ by mistake (writing $2Md^2$ instead of $Md^2$).
- E) is wrong because the parallel axis theorem needs only $I_{cm}$, $M$, and $d$ — the rod's length is never required once $I_{cm}$ is already given.

</details>

