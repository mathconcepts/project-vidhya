---
id: fourier-transform.interleaved-drill
concept_id: fourier-transform
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.6
exam_ids: ["*"]
modality: drill
---

**Cross-concept check: Fourier transform → Laplace transform.**

**Q1.** Find the Fourier transform of $f(t)=e^{-3t}u(t)$.

**A1.** This is the standard one-sided exponential pair: $\mathcal{F}\{e^{-at}u(t)\} = \dfrac{1}{a+i\omega}$ with $a=3$, giving $F(\omega)=\dfrac{1}{3+i\omega}$.

**Q2.** Now find $\mathcal{L}\{e^{-3t}\}$ from the Laplace transform table and substitute $s=i\omega$. Does it match Q1?

**A2.** $\mathcal{L}\{e^{-3t}\} = \dfrac{1}{s+3}$. Setting $s=i\omega$: $\dfrac{1}{i\omega+3}$ — identical to Q1's answer.

**Why this drill exists:** it looks like a coincidence that the two formulas match, but it isn't one. The Fourier transform of a causal, stable signal is exactly the Laplace transform evaluated on the imaginary axis $s=i\omega$ — valid here because the ROC $\text{Re}(s)>-3$ contains that axis. Treating the two transforms as unrelated formulas that happen to look alike, rather than the same $F(s)$ read along a specific line, is the misconception this pairing targets.
