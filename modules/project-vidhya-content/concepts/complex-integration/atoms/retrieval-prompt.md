---
id: complex-integration.retrieval-prompt
concept_id: complex-integration
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
estimated_minutes: 3
retention_tags: ["cauchy-integral-formula", "contour"]
---

From memory, before checking: evaluate $\oint_C \frac{z+1}{z^2-1}\,dz$ where $C$ is $|z|=2$.

<details>
<summary>Answer</summary>

$2\pi i$. $\dfrac{z+1}{(z-1)(z+1)}=\dfrac{1}{z-1}$ (the $(z+1)$ factors cancel, leaving a removable singularity at $z=-1$ and one genuine simple pole at $z=1$, which is inside $C$). By Cauchy's formula with $f\equiv1$: $\oint_C\frac{dz}{z-1}=2\pi i\cdot1=2\pi i$.
</details>
