---
id: stokes-theorem.interleaved_drill
concept_id: stokes-theorem
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.6
exam_ids: ["*"]
modality: drill
---

**Cross-concept check: stokes-theorem → greens-theorem.**

Let $\mathbf F=(-y,\ x,\ 0)$ and let $C$ be the unit circle in the $z=0$ plane, counterclockwise — a curve flat enough for either theorem to reach it.

**Question 1 (greens-theorem):** Evaluate $\oint_C -y\,dx+x\,dy$ directly with Green's Theorem.

*Answer:* density $=\partial_x(x)-\partial_y(-y)=1-(-1)=2$, so $\oint_C=\iint_D 2\,dA=2\pi(1)^2=2\pi$.

**Question 2 (stokes-theorem):** Treat $C$ as the boundary of the flat unit disk sitting in 3-D, and evaluate the same circulation with Stokes' Theorem instead.

*Answer:* $\operatorname{curl}\mathbf F=(0,0,2)$; with $\hat n=\hat k$ on the disk, flux $=\iint_D(0,0,2)\cdot\hat k\,dA=2\pi(1)^2=2\pi$ — identical to Question 1's answer.

**Why this drill exists:** students file Green's Theorem and Stokes' Theorem as two separate formulas rather than seeing that Green's is Stokes' restricted to a flat surface with $\hat n=\hat k$. The moment $C$ lifts off the plane — the boundary of a genuine hemisphere instead of a disk, say — Green's Theorem stops being a candidate at all, while Stokes' Theorem, unchanged, still applies.
