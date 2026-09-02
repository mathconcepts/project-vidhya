---
id: z-transform.interleaved-drill
concept_id: z-transform
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.6
exam_ids: ["*"]
modality: drill
---

**Cross-concept check: Z-transform → Laplace transform.**

**Q1.** A continuous signal $f(t)=e^{-2t}$ is sampled every $T_s=1$ second, giving the sequence $x[n]=f(nT_s)=e^{-2n}=(e^{-2})^n$ for $n\geq0$. Find its Z-transform.

**A1.** This matches the standard pair $a^n u[n]\leftrightarrow \dfrac{z}{z-a}$ with $a=e^{-2}$: $X(z) = \dfrac{z}{z-e^{-2}}$, ROC $|z|>e^{-2}$.

**Q2.** $f(t)=e^{-2t}$ has Laplace transform $F(s)=\dfrac{1}{s+2}$, with a pole at $s=-2$. Using the sampling relationship $z=e^{sT_s}$ with $T_s=1$, where does that pole land in the $z$-plane — and does it match Q1's pole?

**A2.** Substituting $s=-2$, $T_s=1$: $z=e^{-2\cdot1}=e^{-2}$ — exactly the pole location found in Q1.

**Why this drill exists:** $z=e^{sT_s}$ is easy to recite and easy to never actually use. Tracing one specific Laplace pole through the substitution and landing on the exact same numeric $z$-plane pole the direct Z-transform computation produced turns the abstract sampling relationship into a checkable arithmetic fact, not a formula taken on faith.
