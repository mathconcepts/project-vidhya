---
id: complex-numbers-algebra.common-traps
concept_id: complex-numbers-algebra
atom_type: common_traps
bloom_level: 4
difficulty: 0.4
exam_ids: ["*"]
---

- **Computing the argument without checking the quadrant**: $\tan^{-1}(b/a)$ alone only gives a *reference* angle between $-90°$ and $90°$. For a point in the second or third quadrant, this reference angle must be adjusted ($180°-\text{ref}$ or $180°+\text{ref}$) before it is a genuine argument.

- **Applying De Moivre's theorem to $a+bi$ form directly**: De Moivre's theorem needs the number already written as $\cos\theta+i\sin\theta$ (modulus $1$) or $r(\cos\theta+i\sin\theta)$. Skipping the conversion to polar form and applying the angle-multiplying rule to the raw $a+bi$ form gives a meaningless answer.

- **Thinking the cube roots of unity are $1, i, -1$**: those are three of the *four* roots of $z^4=1$. The cube roots of unity are $1$, $\omega$, and $\omega^2$, where $\omega = -\tfrac12+\tfrac{\sqrt3}{2}i$ — genuinely different numbers, from a genuinely different equation.

- **Writing the modulus without the square root**: $|z| = \sqrt{a^2+b^2}$, not $a^2+b^2$. Dropping the square root is a fast, easy slip under time pressure.

- **Confusing $\omega$ with its conjugate**: for cube roots of unity, $\bar\omega = \omega^2$ (not a coincidence — reflecting across the real axis is the same as reflecting the angle from $120°$ to $-120°\equiv240°$). Mixing them up flips the sign of the imaginary part in a simplification.
