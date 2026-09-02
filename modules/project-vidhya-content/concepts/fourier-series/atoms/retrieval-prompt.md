---
id: fourier-series.retrieval-prompt
concept_id: fourier-series
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
estimated_minutes: 3
---

Before checking, try to find $b_1$, the first sine coefficient, for the odd square wave $f(t) = 1$ on $(0,\pi)$, $f(t) = -1$ on $(-\pi,0)$, period $2\pi$.

- **(A)** $b_1 = \frac{4}{\pi}$
- **(B)** $b_1 = \frac{2}{\pi}$
- **(C)** $b_1 = \frac{4}{\pi^2}$
- **(D)** $b_1 = \pi$

<details>
<summary>Answer</summary>

**A**. $f$ is odd, so $a_0 = 0$ and every $a_n = 0$; only $b_n$ can be non-zero. With $L=\pi$, use the half-range form (the integrand $f(t)\sin(nt)$ is even, since odd times odd is even):

$$b_n = \frac{2}{\pi}\int_0^\pi 1\cdot\sin(nt)\,dt = \frac{2}{\pi}\left[-\frac{\cos(nt)}{n}\right]_0^\pi = \frac{2}{n\pi}\bigl(1-\cos(n\pi)\bigr)$$

For $n=1$: $\cos(\pi) = -1$, so $b_1 = \frac{2}{\pi}(1-(-1)) = \frac{4}{\pi}$. (The general pattern — $b_n = \frac{4}{n\pi}$ for odd $n$, $0$ for even $n$, since $1-\cos(n\pi)=0$ whenever $n$ is even — is the standard square-wave series everyone eventually memorises, but this exercise is about deriving $b_1$ from the integral, not recalling the pattern.)

</details>
