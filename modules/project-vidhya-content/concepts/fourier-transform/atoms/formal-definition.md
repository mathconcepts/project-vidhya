---
id: fourier-transform.formal-definition
concept_id: fourier-transform
atom_type: formal_definition
bloom_level: 2
difficulty: 0.48
exam_ids: ["*"]
---

**The Fourier Transform**: For a signal $f(t)$ (not necessarily periodic):

$$F(j\omega) = \int_{-\infty}^\infty f(t) e^{-j\omega t} \, dt$$

The inverse transform recovers the time-domain signal:

$$f(t) = \frac{1}{2\pi} \int_{-\infty}^\infty F(j\omega) e^{j\omega t} \, d\omega$$

Here, $\omega = 2\pi f$ is the angular frequency in radians/second. $F(j\omega)$ is a complex-valued function: its magnitude $|F(j\omega)|$ shows the amplitude of the frequency component $\omega$; its phase $\angle F(j\omega)$ shows the phase shift.

**Key difference from Laplace:** The Fourier transform uses $j\omega$ (purely imaginary) while Laplace uses $s = \sigma + j\omega$ (complex). For a causal, stable signal, the Fourier transform exists along the imaginary axis of the Laplace domain's ROC.

**When to reach for it:** use the Fourier transform on a signal that isn't necessarily zero for $t<0$ and carries no initial conditions to satisfy — the full two-sided integral is what you want. The tempting wrong move is reaching for Laplace's $s = \sigma+j\omega$ machinery on such a signal: Laplace's defining integral runs from $0$ to $\infty$, so it silently discards everything the signal did for $t<0$, while $f(t)$ here is genuinely defined (and possibly nonzero) on the whole real line.

**Geometric interpretation**: Each exponential $e^{-j\omega t}$ is a rotating phasor that spins at rate $\omega$. The integral weighted by $f(t)$ measures the net rotation: frequencies that match $f(t)$'s internal oscillations accumulate (large $|F(j\omega)|$), while mismatched frequencies cancel.
