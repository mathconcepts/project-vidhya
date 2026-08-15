---
id: fourier-transform-worked-example
concept_id: fourier-transform
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
---

# Fourier Transform — Worked Example

## Problem (GATE style)

Find the Fourier transform of $f(t) = e^{-a|t|}$, where $a > 0$, defined as

$$F(\omega) = \int_{-\infty}^{\infty} f(t)\,e^{-i\omega t}\,dt$$

---

## Step 1 — Remove the Absolute Value

The function $e^{-a|t|}$ has different exponential forms for $t < 0$ and $t > 0$. Split the integral at $t = 0$:

$$F(\omega) = \int_{-\infty}^{0} e^{-a(-t)}\,e^{-i\omega t}\,dt + \int_{0}^{\infty} e^{-at}\,e^{-i\omega t}\,dt$$

$$= \int_{-\infty}^{0} e^{(a-i\omega)t}\,dt + \int_{0}^{\infty} e^{-(a+i\omega)t}\,dt$$

---

## Step 2 — Evaluate Each Integral

**First integral** (limit from $-\infty$ to $0$):

Since $a > 0$, we have $\text{Re}(a - i\omega) = a > 0$, so $e^{(a-i\omega)t} \to 0$ as $t \to -\infty$:

$$\int_{-\infty}^{0} e^{(a-i\omega)t}\,dt = \left[\frac{e^{(a-i\omega)t}}{a-i\omega}\right]_{-\infty}^{0} = \frac{1}{a-i\omega} - 0 = \frac{1}{a-i\omega}$$

**Second integral** (limit from $0$ to $\infty$):

Since $a > 0$, we have $\text{Re}(a + i\omega) = a > 0$, so $e^{-(a+i\omega)t} \to 0$ as $t \to +\infty$:

$$\int_{0}^{\infty} e^{-(a+i\omega)t}\,dt = \left[\frac{e^{-(a+i\omega)t}}{-(a+i\omega)}\right]_{0}^{\infty} = 0 - \frac{1}{-(a+i\omega)} = \frac{1}{a+i\omega}$$

---

## Step 3 — Combine and Simplify

$$F(\omega) = \frac{1}{a-i\omega} + \frac{1}{a+i\omega}$$

Add the fractions over the common denominator $(a-i\omega)(a+i\omega) = a^2+\omega^2$:

$$F(\omega) = \frac{(a+i\omega) + (a-i\omega)}{a^2+\omega^2} = \frac{2a}{a^2+\omega^2}$$

---

## Answer

$$\boxed{F(\omega) = \frac{2a}{a^2+\omega^2}}$$

---

## Interpretation of the Spectrum

| Feature | Observation |
|---|---|
| $F(\omega)$ is **real** | Because $f(t)$ is real and **even** ($f(-t)=f(t)$) |
| $F(\omega)$ is **even** | Consistent with $f$ being even |
| $F(0) = \dfrac{2a}{a^2} = \dfrac{2}{a}$ | The DC value equals twice the "area under one side" |
| $F(\omega) \to 0$ as $\omega \to \pm\infty$ | Spectrum decays — signal has finite energy |
| Shape: **Lorentzian** | The FT of a bilateral exponential is a Lorentzian (Cauchy-like) curve |

**Bandwidth trade-off:** As $a$ increases (faster decay in time), the peak $F(0) = 2/a$ decreases and the spectral width $\sim a$ broadens. This is the time-frequency uncertainty principle.

---

## Verification via the Table Pair

The bilateral exponential $e^{-a|t|}$ is a standard transform pair. The result $\dfrac{2a}{a^2+\omega^2}$ can be verified by substituting $f(t)=e^{-at}u(t)$ (one-sided, FT = $\tfrac{1}{a+i\omega}$) and using the symmetry $e^{-a|t|} = e^{-at}u(t) + e^{at}u(-t)$, which gives the same answer by time-reversal and linearity.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Fourier transform of e^(-a|t|)","steps":[{"prompt":"To find the FT of e^{−a|t|}, the absolute value must be handled. How do you split the integral, and what is the integrand in each part?","hint":"Split at t = 0: for t < 0, |t| = −t so e^{−a|t|} = e^{at}. For t ≥ 0, |t| = t so e^{−a|t|} = e^{−at}. Multiply each piece by e^{−iωt}.","answer":"F(ω) = ∫_{−∞}^{0} e^{(a−iω)t} dt + ∫_{0}^{∞} e^{−(a+iω)t} dt. The convergence in each piece is guaranteed by a > 0."},{"prompt":"Evaluate each integral and combine to get F(ω). What is the final closed-form answer?","hint":"First integral: [e^{(a−iω)t}/(a−iω)] from −∞ to 0 = 1/(a−iω). Second: 1/(a+iω). Add over common denominator a²+ω².","answer":"F(ω) = 1/(a−iω) + 1/(a+iω) = 2a/(a²+ω²). The spectrum is a real, even Lorentzian function of ω."}]}
```
