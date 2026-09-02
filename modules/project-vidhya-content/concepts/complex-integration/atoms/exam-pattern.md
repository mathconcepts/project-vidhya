---
id: complex-integration.exam-pattern
concept_id: complex-integration
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.4
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **NAT questions want a single complex number, usually a multiple of $\pi i$** — evaluate a specific contour integral and report the result, most often after checking which of several stated poles lie inside a given circle.

  Example: $\oint_{|z|=3}\frac{dz}{z-2}$. Since $|2|=2<3$, $z=2$ is inside; Cauchy's formula with $f\equiv1$ gives $2\pi i\cdot1=2\pi i$ directly.

- **MCQ questions frequently vary only the contour radius** on an otherwise fixed integrand, testing whether you re-check "inside or outside" rather than reusing the previous part's answer.

- **"True or false" MSQ items test the theorem's exact hypotheses**, not vague intuition:
  - Cauchy's theorem needs $f$ analytic on **and inside** $C$ — analytic only on the boundary is not enough.
  - A pole exactly on $C$ makes the integral undefined, never automatically zero.

- **Time budget:** a single-pole contour integral, once the poles are located and compared to the contour radius, should cost under 90 seconds. If partial fractions or a derivative formula are needed, allow up to three minutes — but the pole-location step itself should never be the slow part.
