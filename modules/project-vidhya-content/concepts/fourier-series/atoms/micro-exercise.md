---
id: fourier-series.micro-exercise
concept_id: fourier-series
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
estimated_minutes: 2
---

For a periodic signal $f(t)$ with period $T$, which of the following represents the DC component in the Fourier series expansion?

- **(A)** $a_0 = \frac{2}{T} \int_0^T f(t) \, dt$
- **(B)** $a_0 = \frac{1}{T} \int_0^T f(t) \, dt$
- **(C)** $a_0 = \int_0^T f(t) \, dt$
- **(D)** $a_0 = \frac{2}{T} \int_0^{T/2} f(t) \, dt$

<details>
<summary>Answer</summary>

**A**. The DC component (average value) is computed as $a_0 = \frac{2}{T} \int_0^T f(t) \, dt$. The factor $\frac{2}{T}$ is part of the standard Fourier series normalization. Note: Some textbooks use $\frac{a_0}{2}$ as the leading term (i.e., without the factor of 2 in the denominator when computing $a_0$), but the most common GATE convention is $a_0 = \frac{2}{T} \int_0^T f(t) \, dt$.

</details>
