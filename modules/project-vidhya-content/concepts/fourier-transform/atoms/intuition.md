---
id: fourier-transform-intuition
concept_id: fourier-transform
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
---

# Fourier Transform — Intuition

## From Series to Transform

The Fourier series handles **periodic** signals by decomposing them into discrete harmonics at frequencies $\omega = \tfrac{n\pi}{L}$.

As the period $2L \to \infty$, the signal becomes **non-periodic** and the discrete harmonics merge into a continuous spectrum. The sum becomes an integral — the **Fourier transform**:

$$\mathcal{F}\{f(t)\} = F(\omega) = \int_{-\infty}^{\infty} f(t)\,e^{-i\omega t}\,dt$$

The inverse recovers $f(t)$ from the spectrum:

$$f(t) = \mathcal{F}^{-1}\{F(\omega)\} = \frac{1}{2\pi}\int_{-\infty}^{\infty} F(\omega)\,e^{i\omega t}\,d\omega$$

$|F(\omega)|$ is the **amplitude spectrum** and $\angle F(\omega)$ is the **phase spectrum**.

---

## Essential Properties

| Property | Time domain | Frequency domain |
|---|---|---|
| Linearity | $af(t)+bg(t)$ | $aF(\omega)+bG(\omega)$ |
| Time shift | $f(t-t_0)$ | $e^{-i\omega t_0}F(\omega)$ |
| Frequency shift | $e^{i\omega_0 t}f(t)$ | $F(\omega-\omega_0)$ |
| Scaling | $f(at)$ | $\tfrac{1}{\|a\|}F\!\left(\tfrac{\omega}{a}\right)$ |
| Differentiation | $f'(t)$ | $i\omega\, F(\omega)$ |
| Convolution | $(f*g)(t)$ | $F(\omega)\cdot G(\omega)$ |
| Multiplication | $f(t)\cdot g(t)$ | $\tfrac{1}{2\pi}(F*G)(\omega)$ |

The **Convolution $\leftrightarrow$ Multiplication** duality is the single most important property in signal processing and GATE problems.

---

## Key Transform Pairs

| $f(t)$ | $F(\omega)$ | Notes |
|---|---|---|
| $e^{-a\|t\|}$, $a>0$ | $\dfrac{2a}{a^2+\omega^2}$ | Bilateral exponential |
| $e^{-at}u(t)$, $a>0$ | $\dfrac{1}{a+i\omega}$ | One-sided exponential |
| $\text{rect}(t/\tau)$ | $\tau\,\text{sinc}(\omega\tau/2)$ | Rect $\leftrightarrow$ Sinc |
| $e^{-\alpha t^2}$ | $\sqrt{\pi/\alpha}\;e^{-\omega^2/(4\alpha)}$ | Gaussian $\leftrightarrow$ Gaussian |
| $\delta(t)$ | $1$ | Delta has flat spectrum |
| $1$ | $2\pi\delta(\omega)$ | DC has single spike |
| $\cos\omega_0 t$ | $\pi[\delta(\omega-\omega_0)+\delta(\omega+\omega_0)]$ | |

---

## Parseval's Theorem (Energy Conservation)

$$\int_{-\infty}^{\infty} |f(t)|^2\,dt = \frac{1}{2\pi}\int_{-\infty}^{\infty} |F(\omega)|^2\,d\omega$$

The total energy in the time domain equals (up to the $\tfrac{1}{2\pi}$ factor) the total energy in the frequency domain.

---

## Existence Condition

The Fourier transform exists (as a classical integral) when $f \in L^1(\mathbb{R})$, i.e., $\int_{-\infty}^{\infty}|f(t)|\,dt < \infty$. Signals like $\sin t$ or $1$ require the distributional (generalised) framework and produce Dirac deltas in the spectrum.

---

## GATE Pattern Recognition

| Situation | Tool |
|---|---|
| $F(\omega)$ is a product $\Rightarrow$ find $f(t)$ | Use convolution theorem |
| Need $\int |f|^2\,dt$ or $\int |F|^2\,d\omega$ | Parseval |
| $f(t)$ contains $e^{i\omega_0 t}$ | Frequency shift: $F(\omega-\omega_0)$ |
| $f(t)$ is real and even | $F(\omega)$ is real and even |
| $f(t)$ is real and odd | $F(\omega)$ is purely imaginary and odd |
