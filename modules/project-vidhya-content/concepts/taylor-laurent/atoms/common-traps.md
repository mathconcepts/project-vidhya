---
id: taylor-laurent.common-traps
concept_id: taylor-laurent
atom_type: common_traps
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
---

**Trap 1 — Confusing the radius of convergence.** The radius of convergence of a Taylor series centered at $z_0$ is the distance to the *nearest* singularity, not the distance to whichever pole you happened to pick. Find all poles first, then take the minimum distance.

**Trap 2 — Dropping the principal part.** Students sometimes write only the positive-power part of a Laurent series, leaving out the negative powers entirely. The principal part is the whole point — it's what encodes the singularity.

**Trap 3 — Wrong sign expanding $\frac1{1-z}$.** $\frac1{1-z}=\sum_{n=0}^\infty z^n$ only for $|z|<1$. For $|z|>1$, rewrite as $-\frac1z\cdot\frac1{1-1/z}=-\sum_{n=0}^\infty z^{-n-1}$ — negative powers, not the same series with a sign flip.
