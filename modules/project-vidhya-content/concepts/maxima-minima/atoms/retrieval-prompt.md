---
id: maxima-minima.retrieval-prompt
concept_id: maxima-minima
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
estimated_minutes: 3
---

The function $f(x) = x^3$ has a critical point at $x = 0$. It is:

- **(A)** A local maximum
- **(B)** A local minimum
- **(C)** An inflection point (not a local extremum)
- **(D)** Not a critical point

<details>
<summary>Answer</summary>

**C**. $f'(x) = 3x^2 = 0$ at $x = 0$, so $x = 0$ is critical.

$f''(x) = 6x$, so $f''(0) = 0$. Second derivative test is inconclusive.

Use first derivative test:
- For $x < 0$: $f'(x) = 3x^2 > 0$ (increasing)
- For $x > 0$: $f'(x) = 3x^2 > 0$ (increasing)

The derivative doesn't change sign, so no local extremum. This is an inflection point where the second derivative changes sign.

</details>
