---
id: fourier-series.common-traps
concept_id: fourier-series
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
---

- **Confusing the normalization constant:** Some textbooks define $a_0 = \frac{1}{T} \int_0^T f(t) \, dt$ (without the factor of 2), while others use $a_0 = \frac{2}{T} \int_0^T f(t) \, dt$. The series representation also changes accordingly. **Always check the exact formula in your course notes; inconsistency is a major source of wrong answers.** GATE typically uses the factor-of-2 version: $a_0 = \frac{2}{T} \int_0^T f(t) \, dt$ and series $= \frac{a_0}{2} + \sum a_n \cos(\ldots) + \sum b_n \sin(\ldots)$.
- **Missing symmetry exploitation:** If $f(t)$ is even (or odd or half-wave symmetric), half the coefficients are zero by inspection. Students who compute all coefficients from scratch waste time. **Always check for symmetries first.**
- **Incorrectly applying integration by parts:** When $f(t)$ is piecewise-defined, computing $a_n$ or $b_n$ requires integration by parts (or tables). Sign errors or dropped boundary terms are common. Verify your result by substituting a test case (e.g., $n=1$) and checking against a known waveform.
