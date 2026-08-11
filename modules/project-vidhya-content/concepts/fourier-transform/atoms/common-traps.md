---
id: fourier-transform.common-traps
concept_id: fourier-transform
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
---

- **Confusing Fourier series and Fourier transform:** Fourier series applies to **periodic** signals and produces **discrete** frequencies. Fourier transform applies to **aperiodic** signals and produces a **continuous** frequency spectrum. If the problem says "periodic," immediately think Fourier series. If it's a one-off pulse or transient, use Fourier transform.
- **Wrong sinc function definition:** There are two common forms: $\text{sinc}(x) = \frac{\sin(x)}{x}$ (unnormalized) and $\text{sinc}(x) = \frac{\sin(\pi x)}{\pi x}$ (normalized). Different textbooks use different conventions. **Always note which is used in your course.** GATE typically uses the unnormalized form.
- **Forgetting the $\frac{1}{2\pi}$ factor in the inverse transform:** The forward transform is $F(j\omega) = \int_{-\infty}^\infty f(t) e^{-j\omega t} dt$, but the inverse is $f(t) = \frac{1}{2\pi} \int_{-\infty}^\infty F(j\omega) e^{j\omega t} d\omega$. The $\frac{1}{2\pi}$ is crucial; omitting it leaves the signal scaled incorrectly.
