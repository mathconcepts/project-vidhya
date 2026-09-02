---
id: inverse-laplace.exam-pattern
concept_id: inverse-laplace
atom_type: exam_pattern
bloom_level: 2
difficulty: 0.35
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **NAT (numeric answer):** invert $F(s)$ and then evaluate $f(t)$ at a specific $t$. Example: find $\mathcal{L}^{-1}\left\{\dfrac{5}{s^2+25}\right\}$ evaluated at $t=\pi/10$. The pair $\dfrac{\omega}{s^2+\omega^2}\leftrightarrow\sin\omega t$ with $\omega=5$ gives $f(t)=\sin 5t$; at $t=\pi/10$, $f=\sin(\pi/2)=1$.
- **MCQ:** given $F(s)$, pick the correct $f(t)$ from four candidates that usually differ by exactly one detail — a missing $t$ factor on a repeated pole, a sign on the decay rate, or a $\cos$ swapped for a $\sin$.
- **MSQ:** identify which of several partial-fraction setups for a given denominator are structurally correct (e.g., which one correctly assigns $\frac{Bs+C}{s^2+\omega^2}$ to an irreducible quadratic factor rather than $\frac{B}{s^2+\omega^2}$ alone).

**Time budget:** a direct table-pair match should take under a minute. Budget two to three minutes for a full partial-fraction decomposition with three or more unknown coefficients, and reserve convolution — rarely the fastest route on GATE — for the rare case where the denominator genuinely resists factoring.
