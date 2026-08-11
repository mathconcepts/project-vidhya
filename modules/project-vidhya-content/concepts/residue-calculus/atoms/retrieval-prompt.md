---
id: residue-calculus.retrieval-prompt
concept_id: residue-calculus
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
estimated_minutes: 3
---

Find the residue of $f(z) = \frac{e^z}{(z-1)^2}$ at the pole $z = 1$.

- **(A)** $e$
- **(B)** $e/2$
- **(C)** $2e$
- **(D)** $e^{-1}$

<details>
<summary>Answer</summary>

**A**. The function $f(z) = \frac{e^z}{(z-1)^2}$ has a pole of order 2 at $z = 1$.
For a pole of order $m$ at $z_0$, the residue is:
$\text{Res}(f, z_0) = \frac{1}{(m-1)!} \lim_{z \to z_0} \frac{d^{m-1}}{dz^{m-1}} [(z - z_0)^m f(z)]$.
With $m = 2$:
$\text{Res}(f, 1) = \frac{1}{(2-1)!} \lim_{z \to 1} \frac{d}{dz} [(z-1)^2 f(z)]$.
$(z-1)^2 f(z) = (z-1)^2 \cdot \frac{e^z}{(z-1)^2} = e^z$.
$\frac{d}{dz}[e^z] = e^z$.
$\lim_{z \to 1} e^z = e^1 = e$.
Therefore, $\text{Res}(f, 1) = \frac{1}{1!} \cdot e = e$.

</details>
