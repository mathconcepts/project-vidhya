---
id: applications-of-derivatives.micro-exercise
concept_id: applications-of-derivatives
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.4
exam_ids: ["*"]
estimated_minutes: 3
---

Find the interval(s) on which $f(x)=x^3-3x^2-9x+5$ is increasing.

- **(A)** $(-1,3)$
- **(B)** $(-\infty,-1)\cup(3,\infty)$
- **(C)** $(-\infty,-3)\cup(1,\infty)$
- **(D)** All real numbers

<details>
<summary>Answer</summary>

**B**. Differentiate: $f'(x)=3x^2-6x-9=3(x^2-2x-3)=3(x-3)(x+1)$.

$f'(x)$ is a upward-opening parabola in $x$ with roots at $x=-1$ and $x=3$. It is **positive outside the roots** and negative between them:

$$
f'(x)>0 \text{ for } x<-1 \text{ or } x>3
$$

So $f$ is increasing on $(-\infty,-1)\cup(3,\infty)$.

**(A)** is the reflex mistake of reading "positive outside the roots" as "positive between the roots" — that interval is actually where $f$ is *decreasing*. **(C)** shifts the roots by using the wrong sign convention while factoring.

</details>
