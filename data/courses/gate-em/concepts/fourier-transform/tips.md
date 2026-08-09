# Teaching Tips: Fourier Transform

## Common Student Errors

- **Confusing Fourier series and Fourier transform:** Fourier series applies to **periodic** signals and produces **discrete** frequencies. Fourier transform applies to **aperiodic** signals and produces a **continuous** frequency spectrum. If the problem says "periodic," immediately think Fourier series. If it's a one-off pulse or transient, use Fourier transform.
- **Wrong sinc function definition:** There are two common forms: $\text{sinc}(x) = \frac{\sin(x)}{x}$ (unnormalized) and $\text{sinc}(x) = \frac{\sin(\pi x)}{\pi x}$ (normalized). Different textbooks use different conventions. **Always note which is used in your course.** GATE typically uses the unnormalized form.
- **Forgetting the $\frac{1}{2\pi}$ factor in the inverse transform:** The forward transform is $F(j\omega) = \int_{-\infty}^\infty f(t) e^{-j\omega t} dt$, but the inverse is $f(t) = \frac{1}{2\pi} \int_{-\infty}^\infty F(j\omega) e^{j\omega t} d\omega$. The $\frac{1}{2\pi}$ is crucial; omitting it leaves the signal scaled incorrectly.

## GATE Question Pattern

Fourier transform problems in GATE follow a predictable flow: **(1) Identify the time-domain signal** (pulse, exponential decay, product of signals), **(2) Apply properties** (shift, scaling, differentiation, convolution), **(3) Compute or recognize the transform** (using tables or via direct integration), and **(4) Verify using Parseval's theorem or sketch the magnitude/phase spectrum**. Multi-step problems combine signal convolution (product in $s$-domain) with system frequency response. The trap: assuming linearity without checking limits, or forgetting that a narrow pulse in time produces a wide spectrum in frequency (and vice versa).

## Speed Tricks for MCQs

- **Sinc-function pattern:** Any rectangular pulse $\to$ sinc in frequency. Width $T$ $\to$ sinc zeros at $\frac{2\pi}{T}$. Amplitude $A$ $\to$ peak $AT$. Memorize this pattern; it covers ~40% of Fourier-transform problems.
- **Duality shortcut:** The Fourier transform has a symmetry: if $f(t) \leftrightarrow F(j\omega)$, then $F(jt) \leftrightarrow 2\pi f(-\omega)$ (with sign flips and factors). Use this to convert between time and frequency domains without explicit integrals when you recognize a dual pair.
- **Property application order:** Time shift, frequency shift, and scaling can be combined. If you see $e^{j\omega_0 t} f(t-t_0) u(t-t_0)$, apply frequency-shift first (gives $F(j(\omega-\omega_0))$), then time-shift (gives phase factor $e^{-j(\omega-\omega_0)t_0}$). Order matters; always go shift-by-shift.

## Must-Memorize Standard Transforms

| Signal $f(t)$ | Fourier Transform $F(j\omega)$ | Notes |
|---|---|---|
| $\delta(t)$ | $1$ | Impulse |
| $1$ | $2\pi \delta(\omega)$ | DC |
| $e^{j\omega_0 t}$ | $2\pi \delta(\omega - \omega_0)$ | Complex exponential |
| $\cos(\omega_0 t)$ | $\pi[\delta(\omega-\omega_0) + \delta(\omega+\omega_0)]$ | Cosine |
| $\sin(\omega_0 t)$ | $\frac{\pi}{j}[\delta(\omega-\omega_0) - \delta(\omega+\omega_0)]$ | Sine |
| $e^{-\alpha t} u(t)$ | $\frac{1}{\alpha + j\omega}$ | Causal exponential |
| $e^{-\alpha \|t\|}$ | $\frac{2\alpha}{\alpha^2 + \omega^2}$ | Two-sided exponential |
| $\text{rect}\left(\frac{t}{T}\right)$ | $T\text{sinc}\left(\frac{\omega T}{2}\right)$ | Rectangular pulse |
| $\text{tri}\left(\frac{t}{T}\right)$ | $T\text{sinc}^2\left(\frac{\omega T}{2}\right)$ | Triangular pulse |

**Key Properties:**

$$\text{Linearity: } af(t) + bg(t) \leftrightarrow aF(j\omega) + bG(j\omega)$$

$$\text{Time-shift: } f(t-t_0) \leftrightarrow e^{-j\omega t_0} F(j\omega)$$

$$\text{Frequency-shift: } e^{j\omega_0 t} f(t) \leftrightarrow F(j(\omega - \omega_0))$$

$$\text{Scaling: } f(at) \leftrightarrow \frac{1}{|a|} F\left(\frac{j\omega}{a}\right)$$

$$\text{Time-domain differentiation: } \frac{df}{dt} \leftrightarrow j\omega F(j\omega)$$

$$\text{Convolution: } f(t) * g(t) \leftrightarrow F(j\omega) G(j\omega)$$

**Parseval's Theorem (Energy / Power):**

$$\int_{-\infty}^\infty |f(t)|^2 dt = \frac{1}{2\pi} \int_{-\infty}^\infty |F(j\omega)|^2 d\omega$$

Time-domain energy = frequency-domain energy (scaled by $\frac{1}{2\pi}$).
