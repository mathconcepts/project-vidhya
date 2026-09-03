---
id: fourier-transform-visual-analogy
concept_id: fourier-transform
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.30
exam_ids: [gate-ma]
scaffold_fade: 0
---

# Fourier Transform — Visual Analogy

## A Prism Splitting White Light

White light is not a single colour — it is a superposition of all visible frequencies (wavelengths) at once. When white light passes through a prism, it **splits into a rainbow**: each frequency component is separated and displayed at a distinct angle.

```
  White light (time signal f(t))
       │
       ▼
  ┌──────────┐
  │  Prism   │   ← Fourier Transform
  │  (ℱ)    │
  └──────────┘
       │
       ▼
  Rainbow (spectrum F(ω)):
  ──────────────────────────────
  low freq ←─────────────→ high freq
  (red)                    (violet)
```

The Fourier transform is the mathematical prism: it takes a time-domain signal $f(t)$ and reveals **how much of each frequency is present**, all at once.

---

## The Gaussian — Its Own Reflection in the Prism

The Gaussian function $f(t) = e^{-\alpha t^2}$ has a remarkable self-similarity property: **its Fourier transform is also a Gaussian**.

$$\mathcal{F}\!\left\{e^{-\alpha t^2}\right\} = \sqrt{\frac{\pi}{\alpha}}\;e^{-\omega^2/(4\alpha)}$$

A narrow Gaussian in time ($\alpha$ large) produces a broad Gaussian in frequency, and vice versa. This is the mathematical statement of the **uncertainty principle**: you cannot simultaneously have a signal that is narrow in both time and frequency.

```gif-scene
{
  "type": "function-trace",
  "expression": "exp(-x*x * 0.5)",
  "x_range": [-5, 5],
  "y_range": [0, 1.2],
  "label": "Gaussian: FT of Gaussian is Gaussian"
}
```

The diagram on this card shows $e^{-x^2/2}$ — the canonical standard normal shape. Its Fourier transform has exactly the same bell-curve shape, scaled by $\sqrt{2\pi}$. No other function family has this self-reproducing property under the Fourier transform.

---

## Rect $\leftrightarrow$ Sinc: The Complementary Pair

A rectangular pulse in time (a window of finite duration) produces a sinc function in frequency:

$$f(t) = \begin{cases}1 & |t| \leq \tau/2 \\ 0 & \text{otherwise}\end{cases} \xrightarrow{\;\mathcal{F}\;} F(\omega) = \tau\cdot\text{sinc}\!\left(\frac{\omega\tau}{2}\right)$$

Sharp edges in time ($\to$) spread energy across all frequencies — this is why a square wave requires infinitely many harmonics.

---

## GATE Takeaway

> The Fourier transform is the universal prism for non-periodic signals. Key symmetries to memorise:
> - Real even $f(t)$ $\Rightarrow$ real even $F(\omega)$
> - Gaussian $\Rightarrow$ Gaussian (unique self-dual pair)
> - Narrow time $\Rightarrow$ broad frequency (uncertainty principle)
> - Convolution in time = multiplication in frequency (the central design principle of LTI systems)
