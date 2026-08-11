---
id: inverse-laplace.formal-definition
concept_id: inverse-laplace
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

**The Inverse Laplace Transform**: Given $F(s)$, the inverse Laplace transform recovers $f(t)$:

$$f(t) = \mathcal{L}^{-1}\{F(s)\} = \frac{1}{2\pi j} \int_{\sigma - j\infty}^{\sigma + j\infty} e^{st} F(s) \, ds$$

where the integration is along a vertical line in the complex plane (at Re$(s) = \sigma$, within the ROC). **In practice**, for rational $F(s)$, we use **partial fraction decomposition** rather than the Bromwich integral: decompose $F(s)$ into simple fractions and match each to a standard inverse-transform pair.

**Geometric interpretation**: Each term $\frac{A}{s+a}$ in the partial-fraction expansion corresponds to a pole at $s = -a$. The location of the pole (its distance from the imaginary axis) directly encodes the exponential decay rate of the time-domain signal. A pole at $s = -3$ produces a factor $e^{-3t}$.
