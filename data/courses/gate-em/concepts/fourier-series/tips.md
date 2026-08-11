# Teaching Tips: Fourier Series

## Common Student Errors

- **Confusing the normalization constant:** Some textbooks define $a_0 = \frac{1}{T} \int_0^T f(t) \, dt$ (without the factor of 2), while others use $a_0 = \frac{2}{T} \int_0^T f(t) \, dt$. The series representation also changes accordingly. **Always check the exact formula in your course notes; inconsistency is a major source of wrong answers.** GATE typically uses the factor-of-2 version: $a_0 = \frac{2}{T} \int_0^T f(t) \, dt$ and series $= \frac{a_0}{2} + \sum a_n \cos(\ldots) + \sum b_n \sin(\ldots)$.
- **Missing symmetry exploitation:** If $f(t)$ is even (or odd or half-wave symmetric), half the coefficients are zero by inspection. Students who compute all coefficients from scratch waste time. **Always check for symmetries first.**
- **Incorrectly applying integration by parts:** When $f(t)$ is piecewise-defined, computing $a_n$ or $b_n$ requires integration by parts (or tables). Sign errors or dropped boundary terms are common. Verify your result by substituting a test case (e.g., $n=1$) and checking against a known waveform.

## GATE Question Pattern

Fourier series problems in GATE typically follow a template: **(1) Identify the waveform** (square, triangle, sawtooth, etc.), **(2) Determine symmetries** (even, odd, half-wave), **(3) Compute one or two coefficients** (usually $a_1, b_1$ or $a_2, b_2$), and **(4) Apply Parseval's theorem or power calculation**. Multi-step problems may ask to "sketch the frequency spectrum" (plot $|a_n|$ and $|b_n|$ vs. $n$) or "find the RMS voltage" using energy conservation. The trap: assuming coefficients without explicit computation, or forgetting that DC and AC components contribute separately to power.

## Speed Tricks for MCQs

- **Symmetry shortcut:** Odd functions → only sines (all $a_n = 0$). Even functions → only cosines (all $b_n = 0$). Half-wave symmetric ($f(t+T/2) = -f(t)$) → only odd harmonics. Recognizing the waveform type in 5 seconds saves you 2–3 minutes of integral computation.
- **Coefficient pattern recognition:** Square wave $\Rightarrow$ $b_n = \frac{4}{n\pi}$ for odd $n$. Triangular $\Rightarrow$ $b_n = \frac{8}{n^2\pi^2}$ for odd $n$ (or sometimes $\frac{8}{n\pi}$ depending on definition). Sawtooth $\Rightarrow$ $a_n, b_n$ both non-zero, $\approx \frac{1}{n}$ decay. Memorizing these patterns for the three most common waveforms covers ~70% of GATE questions.
- **Parseval's power calculation:** For a signal with only odd harmonics and small DC, the dominant power is in the fundamental $\frac{1}{2}b_1^2$. If you see a big coefficient $b_1$, that term alone often gives the approximate power without summing all harmonics.

## Must-Memorize Formulas & Waveforms

**Fourier Series Coefficients:**

$$a_0 = \frac{2}{T} \int_0^T f(t) \, dt$$

$$a_n = \frac{2}{T} \int_0^T f(t) \cos\left(\frac{2\pi n t}{T}\right) dt$$

$$b_n = \frac{2}{T} \int_0^T f(t) \sin\left(\frac{2\pi n t}{T}\right) dt$$

**Parseval's Theorem (average power / energy):**

$$P = \frac{1}{T} \int_0^T f^2(t) \, dt = \frac{a_0^2}{4} + \frac{1}{2} \sum_{n=1}^\infty (a_n^2 + b_n^2)$$

**Standard Waveforms:**

| Waveform | DC ($a_0$) | Cosine Terms | Sine Terms | Decay |
|---|---|---|---|---|
| Square | 0 | None | $\frac{4}{\pi n}$ for odd $n$ | $\propto \frac{1}{n}$ |
| Triangle | 0 | None | $\frac{8}{\pi^2 n^2}$ for odd $n$ | $\propto \frac{1}{n^2}$ |
| Sawtooth | Depends | $a_n \neq 0$ generally | $b_n \neq 0$ generally | $\propto \frac{1}{n}$ |
| Rectified sine | Non-zero | $a_n \neq 0$ for even $n$ | None | $\propto \frac{1}{n^2}$ for even |

**Symmetry Rules:**

- **Even function** ($f(t) = f(-t)$): $b_n = 0$ for all $n$ (no sines)
- **Odd function** ($f(t) = -f(-t)$): $a_0 = 0$, $a_n = 0$ for all $n$ (no DC, no cosines)
- **Half-wave symmetric** ($f(t + T/2) = -f(t)$): $a_n = 0, b_n = 0$ for even $n$ (only odd harmonics)

**RMS Voltage from Fourier series:**

$$V_{\text{rms}} = \sqrt{\frac{1}{T} \int_0^T f^2(t) \, dt} = \sqrt{\frac{a_0^2}{4} + \frac{1}{2}\sum_{n=1}^\infty (a_n^2 + b_n^2)}$$
