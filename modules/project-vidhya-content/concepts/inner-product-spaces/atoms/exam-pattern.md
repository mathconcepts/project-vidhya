---
id: inner-product-spaces.exam-pattern
concept_id: inner-product-spaces
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **MSQ "which of the following is an inner product" — attack positive definiteness first.** It is the cheapest axiom to break: one nonzero $v$ with $\langle v, v \rangle \leq 0$ settles it. Conjugate symmetry and linearity usually hold by construction in the distractors, so checking them first burns time on options that were never going to fail there.

- **The weighted form is the standard dressing.** $\langle u, v \rangle = u^T M v$ on $\mathbb{R}^n$ is a valid inner product **iff $M$ is symmetric positive definite**. Use Sylvester's criterion instead of the axioms.

  Example: $M = \begin{pmatrix} 2 & 1 \\ 1 & 1 \end{pmatrix}$ is symmetric; leading minors are $2 > 0$ and $\det M = 2 - 1 = 1 > 0$, so it is positive definite — valid. (Cross-check: its eigenvalues are $\tfrac{3 \pm \sqrt{5}}{2} \approx 2.618$ and $0.382$, both positive, verified; trace $3$ ✓, det $1$ ✓.) Flip the corner to $M = \begin{pmatrix} 2 & 1 \\ 1 & 0 \end{pmatrix}$ and $\det = -1 < 0$ — not an inner product, and $v = (1, -2)^T$ gives $\langle v, v \rangle = -4$ to prove it.

- **NAT questions want a number, usually an angle or a norm.** $\cos\theta = \dfrac{\langle u, v \rangle}{\|u\|\|v\|}$. Answers are engineered to land on $\pi/3$, $\pi/4$, $\pi/2$ — if your $\cos\theta$ isn't a recognisable value, re-add the products before re-deriving anything.

- **The trap GATE likes: linearity in the second argument.** Over $\mathbb{C}$ the second slot is *conjugate*-linear. "$\langle u, \alpha v \rangle = \alpha \langle u, v \rangle$ for all complex $\alpha$" is a favourite false option — it is only true for real $\alpha$.

- **Second trap: Cauchy–Schwarz equality.** $|\langle u, v\rangle| = \|u\|\|v\|$ holds **iff** $u, v$ are linearly dependent — not merely "when they point the same way." Options phrased as "iff $u = v$" are wrong.

- **Time budget:** an axiom-check MSQ should cost under 90 seconds using positive definiteness + Sylvester. A norm/angle NAT is a 60-second computation. If you're writing out the full linearity expansion on an exam, you've taken the long road.
