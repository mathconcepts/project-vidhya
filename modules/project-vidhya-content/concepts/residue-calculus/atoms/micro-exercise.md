---
id: residue-calculus.micro-exercise
concept_id: residue-calculus
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
estimated_minutes: 2
---

Find the residue of $f(z) = \frac{1}{(z-1)(z-2)}$ at $z = 1$.

- **(A)** $1$
- **(B)** $-1$
- **(C)** $1/2$
- **(D)** $-1/2$

<details>
<summary>Answer</summary>

**B**. Use the residue formula for a simple pole: $\text{Res}(f, z_0) = \lim_{z \to z_0} (z - z_0) f(z)$.
At $z = 1$:
$\text{Res}(f, 1) = \lim_{z \to 1} (z-1) \cdot \frac{1}{(z-1)(z-2)} = \lim_{z \to 1} \frac{1}{z-2} = \frac{1}{1-2} = \frac{1}{-1} = -1$.

</details>
