---
# Alternative body for inverse-laplace.intuition, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: inverse-laplace.intuition.shaken
concept_id: inverse-laplace
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: inverse-laplace-intuition
for_stance: shaken
---

Take $F(s)=\dfrac{1}{s^2+4s+13}$. The quadratic doesn't split into two real linear factors, so complete the square first:

$$s^2+4s+13=(s+2)^2+9$$

Check it: $(s+2)^2=s^2+4s+4$, and $4+9=13$ — matches.

The denominator is now $(s+2)^2+3^2$, the shape $(s+a)^2+\omega^2$ with $a=2$, $\omega=3$. The table pair for that shape is $\dfrac{\omega}{(s+a)^2+\omega^2}\to e^{-at}\sin\omega t$, so multiply and divide by $3$ to match it:

$$F(s)=\frac13\cdot\frac{3}{(s+2)^2+9}\ \Longrightarrow\ f(t)=\frac13e^{-2t}\sin 3t$$

The pole sits at $s=-2\pm 3j$. The real part, $-2$, is the decay rate $e^{-2t}$; the imaginary part, $3$, is the oscillation frequency $\sin 3t$ — reading the pole told you the answer's shape before any table was consulted.
