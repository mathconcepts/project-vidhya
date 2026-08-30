---
# Alternative body for fourier-transform.intuition, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: fourier-transform-intuition.shaken
concept_id: fourier-transform
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: fourier-transform-intuition
for_stance: shaken
---

Take $f(t)=e^{-t}u(t)$. From the table, $F(\omega)=\dfrac{1}{1+i\omega}$.

Convolve $f$ with itself in time — an actual integral:

$$(f*f)(t)=\int_0^t e^{-\tau}e^{-(t-\tau)}\,d\tau=t\,e^{-t},\quad t\geq 0$$

Now do the same thing in frequency, and it is not an integral at all — just a multiplication:

$$F(\omega)\cdot F(\omega)=\frac{1}{(1+i\omega)^2}$$

Check the table for $t\,e^{-t}u(t)$: it transforms to exactly $\dfrac{1}{(1+i\omega)^2}$. Same function, two routes to it — one is an integral over $\tau$, the other is squaring a fraction.

Hold onto this: convolution in time becomes multiplication in frequency, and multiplication is the whole reason to make the trip.
