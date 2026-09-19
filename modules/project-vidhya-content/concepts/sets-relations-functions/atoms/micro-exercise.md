---
id: sets-relations-functions.micro-exercise
concept_id: sets-relations-functions
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.4
estimated_minutes: 2
exam_ids: ["*"]
---

Which of the following functions $f: \mathbb{R} \to \mathbb{R}$ is one-one but **not** onto?

A) $f(x) = x^3$
B) $f(x) = e^x$
C) $f(x) = x^2$
D) $f(x) = \sin x$
E) $f(x) = |x|$

<details>
<summary>Answer</summary>

**Correct answer: B) $f(x) = e^x$.**

**Why B is correct:** $e^x$ is strictly increasing everywhere (its derivative $e^x$ is always positive), so distinct inputs always give distinct outputs — it is one-one. But its range is $(0, \infty)$, never all of $\mathbb{R}$ — no $x$ gives $e^x = 0$ or $e^x = -1$. Range $\ne$ codomain, so it is not onto.

**Why the others fail:**
- A) $x^3$ is both one-one (strictly increasing) **and** onto (every real number has a real cube root) — bijective, not the answer.
- C) $x^2$ is neither: $f(-2) = f(2) = 4$ (not one-one), and the range $[0,\infty)$ misses all negative numbers (not onto).
- D) $\sin x$ is neither: it repeats endlessly (not one-one) and its range $[-1,1]$ is a small slice of $\mathbb{R}$ (not onto).
- E) $|x|$ is neither, for the same two reasons as $x^2$: $f(-1)=f(1)=1$, and the range is $[0,\infty)$.

</details>
