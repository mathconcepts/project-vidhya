---
id: limits-jee.common-traps
concept_id: limits-jee
atom_type: common_traps
bloom_level: 2
difficulty: 0.35
exam_ids: ["*"]
---

- **Applying L'Hôpital's rule to a form that is already answered**: differentiating top and bottom when direct substitution already gives a definite, non-indeterminate value. The derivative ratio is a different number and has no reason to match the true limit — check the form is $\frac00$ or $\frac{\infty}{\infty}$ *before* differentiating anything.
- **Mismatching the standard limit's coefficient**: reading $\lim_{x\to0}\frac{\sin 5x}{3x}$ as $1$ just because "sine over its own argument is $1$." Rewrite it as $\dfrac{5}{3}\cdot\dfrac{\sin 5x}{5x}$ first — the answer is $\dfrac53$, not $1$.
- **Stopping after one round of L'Hôpital's rule**: getting a new $\frac00$ and reading it as the final answer instead of applying the rule again. Check the form again at every stage, not just the first.
- **Substituting $\infty$ straight into $\infty-\infty$**: writing $\sqrt{x^2+x}-x\to\infty-\infty=0$ as $x\to\infty$ without rationalising. Multiplying by the conjugate first gives the real limit, $\frac12$ — not $0$.
- **Collapsing $1^{\infty}$ to $1$ by reflex**: seeing the base tend to $1$ and stopping, ignoring that the exponent is growing without bound at the same time. $1^{\infty}$ is indeterminate — it must be converted to $e^{\lim(\text{exponent})(\text{base}-1)}$, never read off directly.
