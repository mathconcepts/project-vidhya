---
id: complex-numbers.interleaved-drill
concept_id: complex-numbers
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.6
exam_ids: ["*"]
modality: drill
tested_by_atom: complex-numbers.micro-exercise.modulus
---

**Cross-concept check: complex-numbers → analytic-functions.**

Take $f(z)=z^2$, $z=x+iy$.

**Question 1 (complex-numbers):** Write $f(z)$ in the form $u(x,y)+iv(x,y)$.

*Answer:* $z^2=(x+iy)^2=x^2-y^2+2ixy$, so $u=x^2-y^2$ and $v=2xy$ — this is just distributing $i^2=-1$, nothing new yet.

**Question 2 (analytic-functions):** Do $u$ and $v$ satisfy the Cauchy–Riemann equations $u_x=v_y$ and $u_y=-v_x$?

*Answer:* $u_x=2x=v_y$ ✓ (since $v_y=2x$), and $u_y=-2y=-v_x$ ✓ (since $v_x=2y$). Both hold everywhere, so $f$ is analytic — in fact entire, since it's a polynomial.

**Why this drill exists:** students often treat "split $z^2$ into real and imaginary parts" as a purely algebraic warm-up with no further use. It's actually the first step of every Cauchy–Riemann check — the same $u,v$ decomposition feeds directly into testing analyticity, so getting it right here is what analytic-functions problems are built on.
