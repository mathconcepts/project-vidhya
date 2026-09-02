---
id: conformal-mapping.interleaved-drill
concept_id: conformal-mapping
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.6
exam_ids: ["*"]
modality: drill
tested_by_atom: conformal-mapping.micro-exercise
---

**Cross-concept check: conformal-mapping → analytic-functions.**

$f(z)=\dfrac{z-1}{z+1}$ is a bilinear (Möbius) transformation.

**Question 1 (conformal-mapping):** Where is $f$ analytic?

*Answer:* Everywhere except its pole at $z=-1$ — $f$ is a ratio of polynomials, analytic on $\mathbb{C}\setminus\{-1\}$.

**Question 2 (analytic-functions):** Compute $f'(z)$ using the quotient rule, and use it to say where (besides the pole) $f$ fails to be conformal.

*Answer:* $f'(z)=\dfrac{(z+1)-(z-1)}{(z+1)^2}=\dfrac{2}{(z+1)^2}$, which is never $0$ for any finite $z$ (the numerator is the constant $2$). So $f$ is conformal at every point where it's analytic — the only excluded point is the pole itself.

**Why this drill exists:** students sometimes assume "bilinear $\Rightarrow$ conformal everywhere it's defined" as an automatic rule and skip computing $f'$ at all. Here that shortcut happens to give the right answer, but only because this particular numerator is constant — a rational map built from a non-constant numerator can have interior critical points, so actually computing $f'$ and checking it's nonzero is the habit that generalizes, not the shortcut.
