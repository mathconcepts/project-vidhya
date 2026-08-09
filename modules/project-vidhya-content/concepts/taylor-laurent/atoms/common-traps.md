---
id: taylor-laurent.common-traps
concept_id: taylor-laurent
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
---

- **Confusing radius of convergence**: The radius of convergence of a Taylor series centered at $z_0$ is the distance to the nearest singularity, not the distance to a specific pole you pick. Always find ALL poles and take the minimum distance.
- **Forgetting negative powers in Laurent expansions**: Students sometimes write only the positive-power part of a Laurent series, ignoring the principal part. The principal part (negative powers) is the whole point of Laurent expansions — it encodes the singularity.
- **Incorrectly expanding $\frac{1}{1-z}$**: Students often forget that $\frac{1}{1-z} = \sum_{n=0}^{\infty} z^n$ only for $|z| < 1$. For $|z| > 1$, you must rewrite as $-\frac{1}{z-1} = -\frac{1}{z} \sum_{n=0}^{\infty} (1/z)^n = \sum_{n=1}^{\infty} \frac{(-1)^{n+1}}{z^n}$ (negative powers).
