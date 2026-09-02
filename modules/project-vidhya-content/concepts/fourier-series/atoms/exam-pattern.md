---
id: fourier-series.exam-pattern
concept_id: fourier-series
atom_type: exam_pattern
bloom_level: 2
difficulty: 0.35
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **NAT (numeric answer):** compute one specific coefficient ($a_0$, $a_1$, or $b_1$) for a given $f(t)$, rather than the whole infinite series. Example: for $f(t)=t^2$ on $(-1,1)$ with period $T=2$, find $a_0$. Since $f$ is even, $a_0=\frac{2}{T}\int_{-1}^{1}t^2\,dt = \frac{2}{3}$.
- **MCQ:** given $f(t)$, identify which coefficients vanish by symmetry, or match $f(t)$ to its correct partial-sum expression.
- **MSQ:** identify which Dirichlet conditions are required for convergence, or which statement about convergence at a jump discontinuity is correct (the series converges to the average of the left and right limits, not to either one).

**Time budget:** a parity check costs seconds and should always run first. A single coefficient integral by parts (like the $f(x)=x$ example) typically costs one to two minutes; reserve extra time only if the problem explicitly asks for a Parseval-based series evaluation, which needs both a coefficient computation and an energy-integral step.
