---
id: pde-basics.exam_pattern
concept_id: pde-basics
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.7
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **MCQ classification questions** hand you the PDE already written out and ask for its type as one of four labelled options (elliptic, parabolic, hyperbolic, or a fourth distractor like "cannot be classified"). The whole question is reading off $A$, $B$, $C$ and computing $\Delta=B^2-4AC$ once.

  Example: $u_{xx}+2u_{xy}+u_{yy}=0$ gives $A=1$, $B=2$, $C=1$, so $\Delta=2^2-4(1)(1)=0$ — parabolic, option selected without touching the rest of the equation.

- **NAT questions on separation of variables** want a single eigenvalue or coefficient, not the full series solution. Given the domain length $L$ and an index $n$, the expected entry is $\lambda_n=(n\pi/L)^2$ evaluated numerically — for $L=2$, $n=3$, that's $(3\pi/2)^2\approx22.21$.

- **MSQ "which statements are true" questions** probe the separation method's own assumptions rather than the arithmetic: whether the PDE and boundary conditions are both linear and homogeneous, whether the separation constant's sign is forced by the boundary data rather than chosen freely, and whether the resulting solution is a finite combination or an infinite series.

- **Time budget:** a bare classification question should resolve in under thirty seconds — one substitution into $\Delta$. A full separation-of-variables solve with eigenvalue matching against an initial condition runs three to four minutes; most of that belongs to matching Fourier coefficients, not to the separation step itself.
