---
# Alternative body for fourier-transform.worked_example, served when the
# learner stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: fourier-transform.worked-example.assured
concept_id: fourier-transform
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: fourier-transform-worked-example
for_stance: assured
---

$F(\omega)=\dfrac{2a}{a^2+\omega^2}$ comes from splitting at $t=0$ and adding $\frac{1}{a-i\omega}+\frac{1}{a+i\omega}$; once that split is second nature there is nothing left to re-derive.

What actually gets checked: $f$ is real and even, so $F$ must come out real and even with no leftover $i$. An imaginary term surviving to the end means a sign flipped in the split, not that the final simplification is wrong.

The shape is Lorentzian, not Gaussian: $F(0)=2/a$, and the tail falls off as $1/\omega^2$ without ever reaching $0$. Bandwidth trades against peak height — larger $a$ buys a wider spectrum at a lower peak, the time–frequency uncertainty tradeoff in one line, not a separate fact to memorise.

Fastest independent check: $e^{-a|t|}=e^{-at}u(t)+e^{at}u(-t)$ splits the signal into two exponential halves related by time-reversal; linearity on the single known one-sided pair reproduces $\frac{2a}{a^2+\omega^2}$ without redoing the integral at all.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Fourier transform of e^(-a|t|)","steps":[{"prompt":"To find the FT of e^{−a|t|}, the absolute value must be handled. How do you split the integral, and what is the integrand in each part?","hint":"Split at t = 0: for t < 0, |t| = −t so e^{−a|t|} = e^{at}. For t ≥ 0, |t| = t so e^{−a|t|} = e^{−at}. Multiply each piece by e^{−iωt}.","answer":"F(ω) = ∫_{−∞}^{0} e^{(a−iω)t} dt + ∫_{0}^{∞} e^{−(a+iω)t} dt. The convergence in each piece is guaranteed by a > 0."},{"prompt":"Evaluate each integral and combine to get F(ω). What is the final closed-form answer?","hint":"First integral: [e^{(a−iω)t}/(a−iω)] from −∞ to 0 = 1/(a−iω). Second: 1/(a+iω). Add over common denominator a²+ω².","answer":"F(ω) = 1/(a−iω) + 1/(a+iω) = 2a/(a²+ω²). The spectrum is a real, even Lorentzian function of ω."}]}
```
