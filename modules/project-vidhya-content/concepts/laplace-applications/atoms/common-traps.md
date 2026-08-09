---
id: laplace-applications.common-traps
concept_id: laplace-applications
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
---

- **Forgetting or misapplying initial conditions:** The derivative rule is $\mathcal{L}\{y'\} = sY(s) - y(0)$, not just $sY(s)$. Many students skip the $-y(0)$ term, destroying the solution. Double-check: substitute $s \to 0$ in your final $Y(s)$ to verify the initial value is correct.
- **Errors in partial-fraction decomposition of complex rational functions:** When $Y(s)$ has a high-degree denominator (e.g., $(s+1)^2(s+2)(s+3)$), students often make sign or coefficient mistakes in the partial fractions. Use the **cover-up method** strictly, or verify by plugging in test values of $s$ after decomposition.
- **Applying the Final Value Theorem incorrectly:** The theorem $\lim_{t \to \infty} y(t) = \lim_{s \to 0^+} s Y(s)$ is valid **only if** all poles of $Y(s)$ lie in the left half-plane (or on the imaginary axis). If a pole is at $s=0$ or in the right half-plane, the theorem doesn't apply, and $y(t)$ diverges or oscillates unboundedly.
