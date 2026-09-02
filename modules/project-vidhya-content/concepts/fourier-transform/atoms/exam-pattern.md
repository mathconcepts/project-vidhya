---
id: fourier-transform.exam-pattern
concept_id: fourier-transform
atom_type: exam_pattern
bloom_level: 2
difficulty: 0.35
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **NAT (numeric answer):** evaluate $F(\omega)$ at a specific frequency, often $\omega=0$ (the DC / total-area value). Example: for $f(t)=e^{-2|t|}$, find $F(0)$. Using $\dfrac{2a}{a^2+\omega^2}$ with $a=2$, $\omega=0$: $F(0)=\dfrac{4}{4}=1$.
- **MCQ:** match a signal's real/even, real/odd, or neither classification to the correct symmetry constraint on $F(\omega)$ (real-even, imaginary-odd, or neither constrained).
- **MSQ:** identify which listed properties (linearity, time-shift, convolution theorem, Parseval) are stated with the correct sign or scaling factor — the classic trap is a shift theorem with the sign on the exponent flipped.

**Time budget:** a table-pair lookup or a symmetry-based sanity check costs under a minute. A full integral — splitting at $|t|$, integrating each piece, and recombining, as with $e^{-a|t|}$ — typically costs two to three minutes; the symmetry check is worth running immediately afterward since it's nearly free.
