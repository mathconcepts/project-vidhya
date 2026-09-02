---
id: definite-integrals.worked_example
concept_id: definite-integrals
atom_type: worked_example
bloom_level: 3
difficulty: 0.2
exam_ids: ["*"]
scaffold_fade: true
---

**Problem.** Evaluate $\displaystyle\int_0^1 \frac{2x}{1+x^2}\,dx$.

**Step 1 — Choose the substitution.** Let $u=1+x^2$, so $du=2x\,dx$ — the numerator $2x\,dx$ is exactly $du$.

**Step 2 — Convert the limits.** When $x=0$, $u=1$. When $x=1$, $u=2$. The new integral runs from $u=1$ to $u=2$ — there is no need to convert back to $x$ at the end.

**Step 3 — Integrate in $u$.**
$$
\int_1^2 \frac{du}{u} = \left[\ln u\right]_1^2 = \ln 2-\ln 1=\ln 2.
$$

**Step 4 — Box the result.**
$$
\boxed{\int_0^1 \frac{2x}{1+x^2}\,dx=\ln 2\approx 0.6931}
$$

**Verification.** Differentiate the antiderivative directly in $x$: $\dfrac{d}{dx}\ln(1+x^2)=\dfrac{2x}{1+x^2}$, which matches the original integrand — confirming the antiderivative and the substitution were both done correctly, independent of the limit-changing step.
