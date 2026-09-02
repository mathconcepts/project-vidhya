---
id: residue-calculus.exam-pattern
concept_id: residue-calculus
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.4
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **NAT questions want the final integral value**, usually a multiple of $\pi i$, after summing residues of every pole located inside a stated contour.

  Example: $\oint_{|z|=3}\frac{dz}{(z-1)(z+2)}$. Both poles ($1$ and $-2$) satisfy $|1|,|-2|<3$: residues $\frac13,-\frac13$ sum to $0$, so the integral is $0$ — a clean cancellation, worth noticing before grinding through both residue computations separately.

- **MCQ questions on real integrals** test the semicircular-contour method: $\int_{-\infty}^\infty\frac{dx}{1+x^2}=\pi$, obtained by closing the contour in the upper half-plane and picking up only the pole at $z=i$ (never $z=-i$, which sits in the lower half-plane).

- **MSQ "which pole order" questions** pair a rational function with several candidate orders, testing whether repeated factors were counted correctly in the denominator — not whether the residue formula itself is remembered.

- **Time budget:** locating poles and checking which are inside the contour should cost under 45 seconds; each residue computation (simple pole) under 30 seconds more. A problem with two simple poles should be finished well under two minutes total.
