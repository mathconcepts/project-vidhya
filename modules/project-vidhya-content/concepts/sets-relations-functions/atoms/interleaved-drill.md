---
id: sets-relations-functions.interleaved-drill
concept_id: sets-relations-functions
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
modality: drill
tested_by_atom: sets-relations-functions.micro-exercise
---

**Cross-concept check: sets-relations-functions → quadratic-equations.**

**Question 1 (domain from a quadratic inequality):** Find the domain of $f(x) = \sqrt{x^2 - 5x + 6}$.

*Answer:* $f$ is only defined where the expression under the root is $\ge 0$: $x^2 - 5x + 6 \ge 0$. Factor: $x^2-5x+6 = (x-2)(x-3)$. This product is $\ge 0$ when $x \le 2$ or $x \ge 3$ (outside the roots, since the parabola opens upward). So the domain is $(-\infty, 2] \cup [3, \infty)$ — finding the domain of a function required solving a quadratic inequality first.

**Question 2 (is $f$ one-one on this domain?):** On the piece $x \ge 3$, is $f(x)=\sqrt{x^2-5x+6}$ one-one?

*Answer:* Yes. For $x \ge 3$, both $x-2$ and $x-3$ are non-negative and increasing, so $(x-2)(x-3)$ is strictly increasing, and the square root of a strictly increasing non-negative quantity is itself strictly increasing. A strictly increasing function never repeats a value, so it is one-one on this piece — but only on this restricted piece, not on the whole domain found in Question 1 (the left piece $x \le 2$ produces the same output values again).

**Why this drill exists:** "find the domain" and "solve the inequality" feel like separate skills until a function's formula forces them together. Every domain question involving a square root, and every "is this one-one" question on a piecewise-restricted domain, is secretly a quadratic-equations question wearing a functions costume.
