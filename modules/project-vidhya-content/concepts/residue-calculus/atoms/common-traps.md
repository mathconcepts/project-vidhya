---
id: residue-calculus.common-traps
concept_id: residue-calculus
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
---

- **Forgetting the $2\pi i$ factor**: The Residue Theorem includes a factor of $2\pi i$. Students often compute the sum of residues and forget to multiply by $2\pi i$, giving an answer that's off by a factor of $2\pi i$.
- **Confusing residue formula for different pole orders**: For a simple pole at $z_0$, use $\text{Res}(f, z_0) = \lim_{z \to z_0} (z - z_0) f(z)$. For a pole of order $n > 1$, use the derivative formula. Using the simple formula on a higher-order pole gives the wrong answer.
- **Ignoring poles outside the contour**: If a pole lies outside the contour, it contributes zero to the integral. Many students mistakenly include poles from the full factorization without checking whether they're inside or outside.
