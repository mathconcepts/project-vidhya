---
id: z-transform.retrieval-prompt
concept_id: z-transform
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
estimated_minutes: 3
---

Find the Z-transform of $x[n] = n \cdot a^n u[n]$ where $a$ is a constant.

- **(A)** $X(z) = \frac{az}{(z-a)^2}$, $|z| > |a|$
- **(B)** $X(z) = \frac{z}{(z-a)^2}$, $|z| > |a|$
- **(C)** $X(z) = \frac{a}{z(z-a)}$, $|z| > |a|$
- **(D)** $X(z) = \frac{1}{(z-a)^2}$, $|z| > |a|$

<details>
<summary>Answer</summary>

**A**. Using the property $n \cdot x[n] \leftrightarrow -z \frac{dX(z)}{dz}$ (multiplication by $n$ in time): Start with $\mathcal{Z}\{a^n u[n]\} = \frac{z}{z-a}$. Then: $\mathcal{Z}\{n \cdot a^n u[n]\} = -z \frac{d}{dz}\left(\frac{z}{z-a}\right)$. Compute the derivative: $\frac{d}{dz}\left(\frac{z}{z-a}\right) = \frac{(z-a) - z}{(z-a)^2} = \frac{-a}{(z-a)^2}$. Thus: $\mathcal{Z}\{n \cdot a^n u[n]\} = -z \cdot \frac{-a}{(z-a)^2} = \frac{az}{(z-a)^2}$. The repeated pole at $z=a$ (multiplicity 2) produces a term $n \cdot a^n$ in the time domain.

</details>
