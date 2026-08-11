---
id: fourier-series.formal-definition
concept_id: fourier-series
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

**The Fourier Series (Real Form)**: For a periodic function $f(t)$ with period $T$:

$$f(t) = \frac{a_0}{2} + \sum_{n=1}^\infty \left[ a_n \cos\left(\frac{2\pi n t}{T}\right) + b_n \sin\left(\frac{2\pi n t}{T}\right) \right]$$

where the coefficients are:

$$a_0 = \frac{2}{T} \int_0^T f(t) \, dt \quad \text{(DC component)}$$

$$a_n = \frac{2}{T} \int_0^T f(t) \cos\left(\frac{2\pi n t}{T}\right) dt \quad \text{(cosine amplitudes)}$$

$$b_n = \frac{2}{T} \int_0^T f(t) \sin\left(\frac{2\pi n t}{T}\right) dt \quad \text{(sine amplitudes)}$$

The fundamental frequency is $f_1 = \frac{1}{T}$ (or $\omega_1 = \frac{2\pi}{T}$ in radians/sec). Higher harmonics oscillate at $nf_1, 2nf_1, \ldots$

**Geometric interpretation**: Each integral $a_n$ (or $b_n$) is a projection of $f(t)$ onto the basis function $\cos(n\omega_1 t)$ (or $\sin(n\omega_1 t)$). Orthogonality of sines and cosines ensures that each harmonic captures exactly one frequency component, with no interference. The process is like taking snapshots of $f(t)$ at all possible pure-tone frequencies and measuring how much of each tone is present.
