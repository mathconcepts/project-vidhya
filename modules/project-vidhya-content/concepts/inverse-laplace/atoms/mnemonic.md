---
id: inverse-laplace.mnemonic
concept_id: inverse-laplace
atom_type: mnemonic
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
modality: mnemonic
---

**The device: read the pole before you decompose.** State the pole type out loud first, and the shape of $f(t)$ is already decided:

- **Real** pole ($s=-a$) → plain exponential, $e^{-at}$.
- **Imaginary** pair ($s=\pm j\omega$) → pure sinusoid, $\sin\omega t$ or $\cos\omega t$.
- **Complex** pair ($s=-a\pm j\omega$) → damped sinusoid, $e^{-at}\sin\omega t$.
- **Repeated** pole ($(s+a)^2$) → an extra factor of $t$ riding on the exponential, $t\,e^{-at}$.

Say it as one phrase: *real decays, imaginary sings, complex dances, repeated multiplies.*

**Worked micro-example.** $F(s) = \dfrac{4}{(s+1)^2+16}$: the pole is at $s=-1\pm 4j$ — complex, so the answer must be a damped sinusoid before any algebra runs. The numerator already equals $\omega=4$, matching the table pair $\dfrac{\omega}{(s+a)^2+\omega^2}\leftrightarrow e^{-at}\sin\omega t$ directly: $f(t)=e^{-t}\sin 4t$.

**Sanity-check reflex:** after inverting, check that the shape you produced (exponential, sinusoid, damped sinusoid, or $t$-scaled exponential) matches the pole type you named at the start. A partial-fractions slip usually survives the arithmetic but breaks this match.
