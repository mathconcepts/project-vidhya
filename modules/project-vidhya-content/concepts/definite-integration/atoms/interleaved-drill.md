---
id: definite-integration.interleaved-drill
concept_id: definite-integration
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.58
modality: drill
tested_by_atom: definite-integration.micro_exercise
exam_ids: ["*"]
---

**Cross-concept check: definite integration $\leftrightarrow$ limits.**

The formal definition of a definite integral IS a limit — the "limit of a sum." This drill runs the connection both directions.

**Question 1 (limit $\to$ integral):** Evaluate $\displaystyle\lim_{n\to\infty}\frac{1}{n}\sum_{k=1}^{n}\sqrt{1+\frac{k}{n}}$ by recognising it as a definite integral.

*Answer:* Writing $x=\frac{k}{n}$, the sum is a right-endpoint Riemann sum for $f(x)=\sqrt{1+x}$ over $[0,1]$, with strip width $\frac{1}{n}$:

$$\lim_{n\to\infty}\frac{1}{n}\sum_{k=1}^n \sqrt{1+\frac{k}{n}} = \int_0^1 \sqrt{1+x}\,dx = \left[\frac{2}{3}(1+x)^{3/2}\right]_0^1 = \frac{2}{3}\left(2\sqrt{2}-1\right) \approx 1.219$$

The limit, which looks unapproachable term by term, becomes an ordinary substitution integral the moment it is recognised as a Riemann sum.

**Question 2 (integral $\to$ limit, the reverse skill):** Express $\displaystyle\int_0^1 x^2\,dx$ as a limit of a sum, and confirm both routes give the same value.

*Answer:* $\displaystyle\int_0^1 x^2\,dx = \lim_{n\to\infty}\frac{1}{n}\sum_{k=1}^n\left(\frac{k}{n}\right)^2$. Directly, $\int_0^1 x^2\,dx=\left[\frac{x^3}{3}\right]_0^1=\frac{1}{3}$ — matching the known limit value for this standard sum.

**Why this drill exists:** a student who only ever meets "limit of a sum" as a definition to recite, never as a tool to convert an unfriendly limit into a friendly integral, cannot solve the JEE questions built specifically around Question 1's direction. Practising the reverse direction (Question 2) is what makes the forward direction recognisable on sight.
