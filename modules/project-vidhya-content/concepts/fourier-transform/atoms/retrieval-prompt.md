---
id: fourier-transform.retrieval-prompt
concept_id: fourier-transform
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
estimated_minutes: 3
---

Before checking, try to find the Fourier transform of $f(t) = \text{rect}\left(\frac{t}{4}\right)$ where $\text{rect}(u) = 1$ for $|u| \leq 0.5$ and $0$ otherwise. This pulse has width 4 and height 1.

- **(A)** $F(j\omega) = 4\,\text{sinc}(2\omega)$, where $\text{sinc}(x) = \frac{\sin(x)}{x}$
- **(B)** $F(j\omega) = 2\,\text{sinc}(2\omega)$
- **(C)** $F(j\omega) = 4\,\text{sinc}(4\omega)$
- **(D)** $F(j\omega) = \text{sinc}(\omega)$

<details>
<summary>Answer</summary>

**A**. The pulse is $1$ on $[-2,2]$, so integrate directly rather than reaching for a memorised formula:

$$F(j\omega) = \int_{-2}^{2} e^{-j\omega t}\,dt = \left[\frac{e^{-j\omega t}}{-j\omega}\right]_{-2}^{2} = \frac{e^{-2j\omega}-e^{2j\omega}}{-j\omega} = \frac{2\sin(2\omega)}{\omega}$$

Write this in the unnormalized sinc convention $\text{sinc}(x)=\sin(x)/x$ used throughout this concept by multiplying and dividing by $2$:

$$F(j\omega) = \frac{2\sin(2\omega)}{\omega} = 4\cdot\frac{\sin(2\omega)}{2\omega} = 4\,\text{sinc}(2\omega)$$

In general, a rect pulse of height $A$ and width $T$ transforms to $AT\,\text{sinc}(\omega T/2)$ — here $A=1$, $T=4$, giving exactly $4\,\text{sinc}(2\omega)$.

</details>
