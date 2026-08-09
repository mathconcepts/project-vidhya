---
id: fourier-transform.retrieval-prompt
concept_id: fourier-transform
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
estimated_minutes: 3
---

Find the Fourier transform of $f(t) = \text{rect}\left(\frac{t}{4}\right)$ where $\text{rect}(u) = \begin{cases} 1 & |u| \leq 0.5 \\ 0 & \text{otherwise} \end{cases}$. This pulse has width 4 and height 1.

- **(A)** $F(j\omega) = 4\text{sinc}\left(\frac{2\omega}{\pi}\right)$
- **(B)** $F(j\omega) = 2\text{sinc}(\omega)$
- **(C)** $F(j\omega) = 4\text{sinc}\left(\frac{\omega}{\pi}\right)$
- **(D)** $F(j\omega) = \text{sinc}\left(\frac{\omega}{2}\right)$

<details>
<summary>Answer</summary>

**A**. A rect pulse with width $T$ and height $A$ has Fourier transform $AT\text{sinc}\left(\frac{\omega T}{2}\right)$. Here, width $T=4$, height $A=1$, so $F(j\omega) = 1 \cdot 4 \cdot \text{sinc}\left(\frac{4\omega}{2}\right) = 4\text{sinc}(2\omega)$. Wait, but the sinc definition must be checked: $\text{sinc}(x) = \frac{\sin(x)}{x}$. With this: $F(j\omega) = 4 \frac{\sin(2\omega)}{2\omega} = 2\frac{\sin(2\omega)}{\omega}$. Option A writes $4\text{sinc}\left(\frac{2\omega}{\pi}\right)$, which uses a different scaling. The normalized sinc $\text{sinc}(x) = \frac{\sin(\pi x)}{\pi x}$ gives $4\text{sinc}\left(\frac{2\omega}{\pi}\right) = 4\frac{\sin(2\omega)}{2\omega}$. This matches. So A is correct with the normalized sinc convention.

</details>
