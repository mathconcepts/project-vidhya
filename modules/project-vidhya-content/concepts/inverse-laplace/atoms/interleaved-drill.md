---
id: inverse-laplace.interleaved-drill
concept_id: inverse-laplace
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.6
exam_ids: ["*"]
modality: drill
---

**Cross-concept check: inverse Laplace transform → Laplace applications.**

**Q1.** Find $\mathcal{L}^{-1}\left\{\dfrac{3}{s(s+3)}\right\}$ by partial fractions.

**A1.** $\dfrac{3}{s(s+3)} = \dfrac{A}{s}+\dfrac{B}{s+3}$. Multiplying through: $3=A(s+3)+Bs$. At $s=0$: $A=1$. At $s=-3$: $-3B=3\Rightarrow B=-1$. So $\dfrac{3}{s(s+3)}=\dfrac{1}{s}-\dfrac{1}{s+3}$, giving $y(t) = 1-e^{-3t}$.

**Q2.** That $Y(s)=\dfrac{3}{s(s+3)}$ is exactly what you'd get transforming $y'+3y=3$, $y(0)=0$. Without inverting again, use the final value theorem to check the $t\to\infty$ limit of Q1's answer.

**A2.** $\displaystyle\lim_{t\to\infty}y(t) = \lim_{s\to0}sY(s) = \lim_{s\to0}\frac{3}{s+3} = 1$ — and indeed $y(t)=1-e^{-3t}\to 1$ as $t\to\infty$. The theorem applies here because the only pole of $sY(s)$, at $s=-3$, sits in the left half-plane.

**Why this drill exists:** partial-fraction inversion can feel like pure algebra, disconnected from what it's solving. Pairing it with the final value theorem — which needs no inversion at all — gives a free check on the partial-fraction work and shows that $Y(s)$ was never just an abstract expression; it was the transform of a specific ODE's solution the whole time.
