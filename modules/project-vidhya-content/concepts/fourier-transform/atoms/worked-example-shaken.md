---
# Alternative body for fourier-transform.worked_example, served when the
# learner stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: fourier-transform.worked-example.shaken
concept_id: fourier-transform
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: fourier-transform-worked-example
for_stance: shaken
---

Split at $t=0$, because $|t|$ means two different formulas on the two sides:

$$F(\omega)=\int_{-\infty}^{0}e^{at}e^{-i\omega t}\,dt+\int_{0}^{\infty}e^{-at}e^{-i\omega t}\,dt$$

Do the left piece first. Since $a>0$, $e^{(a-i\omega)t}\to0$ as $t\to-\infty$:

$$\int_{-\infty}^{0}e^{(a-i\omega)t}\,dt=\left[\frac{e^{(a-i\omega)t}}{a-i\omega}\right]_{-\infty}^{0}=\frac{1}{a-i\omega}$$

Now the right piece, same reasoning as $t\to\infty$:

$$\int_{0}^{\infty}e^{-(a+i\omega)t}\,dt=\frac{1}{a+i\omega}$$

Add the two pieces over the common denominator $(a-i\omega)(a+i\omega)=a^2+\omega^2$:

$$F(\omega)=\frac{(a+i\omega)+(a-i\omega)}{a^2+\omega^2}=\frac{2a}{a^2+\omega^2}$$

Check it: $f(t)$ is real and even, so $F(\omega)$ should come out real and even too — and it did, with no leftover $i$ anywhere.

Hold onto this: split exactly at the point where the formula itself changes, then treat each half like the one-sided exponential pair you already know.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Fourier transform of e^(-a|t|)","steps":[{"prompt":"To find the FT of e^{−a|t|}, the absolute value must be handled. How do you split the integral, and what is the integrand in each part?","hint":"Split at t = 0: for t < 0, |t| = −t so e^{−a|t|} = e^{at}. For t ≥ 0, |t| = t so e^{−a|t|} = e^{−at}. Multiply each piece by e^{−iωt}.","answer":"F(ω) = ∫_{−∞}^{0} e^{(a−iω)t} dt + ∫_{0}^{∞} e^{−(a+iω)t} dt. The convergence in each piece is guaranteed by a > 0."},{"prompt":"Evaluate each integral and combine to get F(ω). What is the final closed-form answer?","hint":"First integral: [e^{(a−iω)t}/(a−iω)] from −∞ to 0 = 1/(a−iω). Second: 1/(a+iω). Add over common denominator a²+ω².","answer":"F(ω) = 1/(a−iω) + 1/(a+iω) = 2a/(a²+ω²). The spectrum is a real, even Lorentzian function of ω."}]}
```
