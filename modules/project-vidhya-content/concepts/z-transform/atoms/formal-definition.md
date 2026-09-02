---
id: z-transform.formal-definition
concept_id: z-transform
atom_type: formal_definition
bloom_level: 2
difficulty: 0.48
exam_ids: ["*"]
---

**The Z-Transform**: For a discrete-time sequence $x[n]$ (defined for $n = 0, 1, 2, \ldots$ or $\ldots, -1, 0, 1, \ldots$):

$$X(z) = \sum_{n=-\infty}^\infty x[n] z^{-n}$$

where $z$ is a complex variable. The inverse Z-transform recovers the sequence:

$$x[n] = \frac{1}{2\pi j} \oint X(z) z^{n-1} dz$$

where the contour is a closed path in the region of convergence (ROC). **In practice**, for rational $X(z)$, we use partial fractions, just as with Laplace transforms.

**Relationship to Laplace and Fourier transforms:** If a continuous-time signal $f(t)$ is **sampled** at times $t = nT_s$ (where $T_s$ is the sample period), the discrete-time sequence is $x[n] = f(nT_s)$. The Z-transform of $x[n]$ is related to the Laplace transform of the sampled signal: $z = e^{sT_s}$.

**Geometric interpretation:** Poles and zeros of $X(z)$ lie in the complex $z$-plane. For a causal, stable discrete-time system, all poles must lie **inside the unit circle** $|z| = 1$. Poles on the unit circle → marginal stability (oscillatory boundary); outside → instability (exponential growth).

**When to reach for it:** use the Z-transform once the model is a discrete-time recurrence — a difference equation relating $x[n], x[n-1], \ldots$ — never a differential equation with an actual $dx/dt$ in it. The tempting wrong move is importing Laplace's differentiation rule directly onto a sampled sequence; there is no derivative to transform. The correct discrete parallel is the shift theorem, $x[n-1] \leftrightarrow z^{-1}X(z)$, and applying $s Y(s)$-style reasoning to a recurrence produces an equation with no $z$ in it at all.
