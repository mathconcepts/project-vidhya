---
id: improper-integrals.worked_example
concept_id: improper-integrals
atom_type: worked_example
bloom_level: 3
difficulty: 0.3
exam_ids: ["*"]
scaffold_fade: true
---

**Problem.** Evaluate $\displaystyle\int_0^1 \frac{1}{\sqrt{x}}\,dx$.

**Step 1 — Spot the trouble.** The integrand $x^{-1/2}$ is undefined at $x=0$, which is at the interval's boundary — this is a **Type II** improper integral, not an ordinary one.

**Step 2 — Back off from the singularity.** Replace the lower limit with $\varepsilon>0$ and integrate normally first:
$$
\int_\varepsilon^1 x^{-1/2}\,dx=\left[2x^{1/2}\right]_\varepsilon^1=2-2\sqrt{\varepsilon}.
$$

**Step 3 — Take the limit.** Let $\varepsilon\to0^+$:
$$
\lim_{\varepsilon\to0^+}\left(2-2\sqrt{\varepsilon}\right)=2-0=2.
$$

**Step 4 — Box the result.**
$$
\boxed{\int_0^1 \frac{1}{\sqrt{x}}\,dx=2}
$$

**Verification.** Classify with the point-singularity $p$-test first: here $p=\tfrac12<1$, so convergence is expected before any arithmetic — the computed finite value $2$ is consistent with that prediction. Differentiating the antiderivative also confirms it directly: $\dfrac{d}{dx}\left(2x^{1/2}\right)=x^{-1/2}$, the original integrand.
