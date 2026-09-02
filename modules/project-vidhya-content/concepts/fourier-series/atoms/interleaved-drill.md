---
id: fourier-series.interleaved-drill
concept_id: fourier-series
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.6
exam_ids: ["*"]
modality: drill
---

**Cross-concept check: Fourier series → Fourier transform.**

**Q1.** Find $b_1$ for the odd square wave $f(t)=1$ on $(0,\pi)$, $f(t)=-1$ on $(-\pi,0)$, period $2\pi$.

**A1.** $b_n = \dfrac{2}{\pi}\int_0^\pi \sin(nt)\,dt = \dfrac{2}{n\pi}(1-\cos n\pi)$; at $n=1$, $b_1 = \dfrac{2}{\pi}(1-(-1)) = \dfrac{4}{\pi}$.

**Q2.** Now find the Fourier transform of a single pulse from that wave — $f(t)=1$ for $|t|<\pi/2$, $0$ otherwise (one "on" half-period, isolated, never repeating).

**A2.** $F(\omega)=\displaystyle\int_{-\pi/2}^{\pi/2} e^{-i\omega t}\,dt = \dfrac{2\sin(\omega\pi/2)}{\omega}$.

**Why this drill exists:** it's tempting to treat "periodic signal → series, discrete harmonics" and "aperiodic signal → transform, continuous spectrum" as an arbitrary rule to memorise. They're not independent tools: stretch the square wave's period toward infinity and the discrete harmonic amplitudes (scaled by the period) converge to samples of exactly this continuous transform. The two concepts describe one limit, approached from opposite sides.
