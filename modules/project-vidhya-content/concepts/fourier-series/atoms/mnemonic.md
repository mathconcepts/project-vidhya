---
id: fourier-series.mnemonic
concept_id: fourier-series
atom_type: mnemonic
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
modality: mnemonic
---

**The device: odd sings, even hums a steady note.** Parity decides which coefficient family survives before any integral is written:

- **Odd** function → only $b_n$ (sine terms) can be nonzero; $a_0=0$ and every $a_n=0$.
- **Even** function → only $a_0$ and $a_n$ (cosine terms plus a steady DC level) can be nonzero; every $b_n=0$.

**Worked micro-example.** Take $f(t)=t^2$ on $(-1,1)$, period $T=2$. Check parity first: $f(-t)=(-t)^2=t^2=f(t)$, so $f$ is even — every $b_n=0$ immediately, no integral needed for those. For the DC term:

$$a_0 = \frac{2}{T}\int_{-1}^{1} t^2\,dt = \int_{-1}^{1}t^2\,dt = \frac{2}{3}$$

**Sanity-check reflex:** if your parity check said "odd" but you computed a nonzero $a_0$ or $a_n$ (or "even" but got a nonzero $b_n$), the error is in the integral you set up, not in the parity rule — go back and recheck which coefficients you should never have been computing.
