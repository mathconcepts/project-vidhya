---
id: fourier-transform.micro-exercise
concept_id: fourier-transform
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
estimated_minutes: 2
---

The Fourier transform of a rectangular pulse $f(t) = \begin{cases} A & |t| \leq \frac{T}{2} \\ 0 & \text{otherwise} \end{cases}$ is given by which of the following?

- **(A)** $F(j\omega) = AT \text{sinc}\left(\frac{\omega T}{2}\right)$ where $\text{sinc}(x) = \frac{\sin(x)}{x}$
- **(B)** $F(j\omega) = \frac{A}{j\omega}$
- **(C)** $F(j\omega) = \frac{A}{\omega^2}$
- **(D)** $F(j\omega) = A \delta(\omega)$

<details>
<summary>Answer</summary>

**A**. The Fourier transform of a rectangular pulse is: $F(j\omega) = \int_{-T/2}^{T/2} A e^{-j\omega t} dt = A \left[ \frac{e^{-j\omega t}}{-j\omega} \right]_{-T/2}^{T/2} = A \frac{e^{j\omega T/2} - e^{-j\omega T/2}}{j\omega} = A \frac{2\sin(\omega T/2)}{\omega} = AT\text{sinc}\left(\frac{\omega T}{2}\right)$. This sinc function decays as $\frac{1}{\omega}$ and exhibits zero-crossings at multiples of $\frac{2\pi}{T}$, reflecting the finite duration of the pulse.

</details>
