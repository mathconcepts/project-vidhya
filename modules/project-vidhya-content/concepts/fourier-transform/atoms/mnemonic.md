---
id: fourier-transform.mnemonic
concept_id: fourier-transform
atom_type: mnemonic
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
modality: mnemonic
---

**The device: even stays real, odd turns imaginary.** Two symmetry facts pin down the shape of $F(\omega)$ before any integral runs:

- $f(t)$ real and **even** $\Rightarrow$ $F(\omega)$ real and even.
- $f(t)$ real and **odd** $\Rightarrow$ $F(\omega)$ purely imaginary and odd.

Hold onto one extra fact alongside it: the Gaussian is the only function family that reproduces its own shape under the transform — everything else changes form, the Gaussian only rescales.

**Worked micro-example.** $f(t)=e^{-2|t|}$ is real and even, so $F(\omega)$ must come out real with no leftover $i$. Using the table pair $e^{-a|t|}\leftrightarrow\dfrac{2a}{a^2+\omega^2}$ with $a=2$: $F(0)=\dfrac{2\cdot2}{2^2+0}=\dfrac{4}{4}=1$ — real, as predicted, and it's the DC value (total area under one side of the pulse).

**Sanity-check reflex:** before trusting a computed $F(\omega)$, check it against the symmetry it was owed — a real-and-even $f(t)$ that produces a complex-looking $F(\omega)$ means a sign or algebra slip happened in the integral, not that the symmetry rule has an exception.
