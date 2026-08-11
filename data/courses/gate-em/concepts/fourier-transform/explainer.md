# Fourier Transform

> GATE Engineering Mathematics | Transform Theory | medium frequency | difficulty: 0.6

## Intuition First

If Fourier series decomposes a periodic signal into discrete frequencies (harmonics), the Fourier transform extends this to *aperiodic* signals. It answers: "What frequencies are present in a one-off pulse, a chirp, or any non-repeating waveform?" Instead of discrete frequency bins, the transform produces a continuous frequency spectrum. It's the generalization that turns periodicity loose and opens the door to analyzing transient phenomena.

## Core Definition

**The Fourier Transform**: For a signal $f(t)$ (not necessarily periodic):

$$F(j\omega) = \int_{-\infty}^\infty f(t) e^{-j\omega t} \, dt$$

The inverse transform recovers the time-domain signal:

$$f(t) = \frac{1}{2\pi} \int_{-\infty}^\infty F(j\omega) e^{j\omega t} \, d\omega$$

Here, $\omega = 2\pi f$ is the angular frequency in radians/second. $F(j\omega)$ is a complex-valued function: its magnitude $|F(j\omega)|$ shows the amplitude of the frequency component $\omega$; its phase $\angle F(j\omega)$ shows the phase shift.

**Key difference from Laplace:** The Fourier transform uses $j\omega$ (purely imaginary) while Laplace uses $s = \sigma + j\omega$ (complex). For a causal, stable signal, the Fourier transform exists along the imaginary axis of the Laplace domain's ROC.

**Geometric interpretation**: Each exponential $e^{-j\omega t}$ is a rotating phasor that spins at rate $\omega$. The integral weighted by $f(t)$ measures the net rotation: frequencies that match $f(t)$'s internal oscillations accumulate (large $|F(j\omega)|$), while mismatched frequencies cancel.

## What Happens (Worked Example)

**Example**: Find the Fourier transform of $f(t) = e^{-\alpha |t|}$ (a two-sided exponential decay).

**What happens:**

Split into positive and negative time:
$$F(j\omega) = \int_{-\infty}^0 e^{\alpha t} e^{-j\omega t} dt + \int_0^\infty e^{-\alpha t} e^{-j\omega t} dt$$

$$= \int_{-\infty}^0 e^{(\alpha - j\omega) t} dt + \int_0^\infty e^{-(\alpha + j\omega) t} dt$$

$$= \left[ \frac{e^{(\alpha - j\omega)t}}{\alpha - j\omega} \right]_{-\infty}^0 + \left[ \frac{e^{-(\alpha + j\omega)t}}{-(\alpha + j\omega)} \right]_0^\infty$$

$$= \frac{1}{\alpha - j\omega} + \frac{1}{\alpha + j\omega}$$

$$= \frac{(\alpha + j\omega) + (\alpha - j\omega)}{(\alpha - j\omega)(\alpha + j\omega)} = \frac{2\alpha}{\alpha^2 + \omega^2}$$

Thus:
$$F(j\omega) = \frac{2\alpha}{\alpha^2 + \omega^2}$$

This is a real, even function: no phase shift, only magnitude. The spectrum has a peak at $\omega = 0$ (DC) and decays as $\frac{1}{\omega^2}$ for large $\omega$.

**Why it works:**

The two-sided exponential is an even function in time, so its Fourier transform is purely real and even in frequency. The decay rate $\alpha$ in the time domain determines the bandwidth: faster decay (large $\alpha$) $\Rightarrow$ broader spectrum (large $F(j\omega)$ at high $\omega$). Conversely, a narrowband signal (concentrated spectrum) extends far in time.

## GATE MA Relevance

> **Why it matters in GATE MA:** Fourier transform appears in 4–6% of GATE papers. Problems typically ask to (1) compute $F(j\omega)$ for standard pulse/decay signals, (2) apply time-shift or frequency-shift properties, (3) identify waveforms from spectral plots, or (4) use Parseval's theorem to relate energy in time and frequency domains. It bridges signal processing and communication theory, essential for understanding bandwidth, filters, and modulation.
