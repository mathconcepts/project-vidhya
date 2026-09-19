---
id: complex-numbers-algebra.exam-pattern
concept_id: complex-numbers-algebra
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.45
exam_ids: ["*"]
modality: text
---

**How JEE actually asks this.**

- **MCQ: quadrant-checked argument.** Any question that gives $z=a+bi$ with a negative real or imaginary part is quietly testing whether the quadrant adjustment was made after computing the reference angle — this is the single most common source of a wrong option.

- **NAT: powers via De Moivre.** "Find $z^n$" for a moderately large $n$ is a cue to convert to polar form first, apply De Moivre, then reduce the resulting angle modulo $360°$ — never expand the binomial directly for $n \ge 4$.

- **Trap: $\omega$ notation.** JEE problems using $1+\omega+\omega^2$ or $\omega^{100}$ expect you to reduce large powers using $\omega^3=1$ first (e.g. $\omega^{100}=\omega^{99}\cdot\omega=(\omega^3)^{33}\cdot\omega=\omega$) rather than computing the power directly.

- **Trap: "purely real" or "purely imaginary" conditions.** These translate to $\text{Im}(z)=0$ or $\text{Re}(z)=0$ respectively — a common slip is testing the modulus or argument instead of the actual real/imaginary part.

- **Time budget:** a modulus-and-argument identification question should take under 40 seconds — sketch the quadrant, compute the reference angle, adjust, done.
