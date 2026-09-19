---
id: indefinite-integration.micro_exercise
concept_id: indefinite-integration
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.45
estimated_minutes: 3
exam_ids: ["*"]
---

$\displaystyle\int \frac{x^3+1}{x^2+1}\,dx$ equals:

(A) $\dfrac{x^2}{2} + \arctan x - \dfrac{1}{2}\ln(x^2+1) + C$
(B) $\arctan x - \dfrac{1}{2}\ln(x^2+1) + C$
(C) $\dfrac{x^2}{2} - \ln(x^2+1) + C$
(D) $\dfrac{x^4}{4} + \dfrac{1}{x^2+1} + C$
(E) None of these

<details>
<summary>Answer</summary>

**Correct answer: (A)**

The integrand is improper (top degree 3, bottom degree 2), so divide first: $x^3+1 = x(x^2+1) + (1-x)$, giving

$$\frac{x^3+1}{x^2+1} = x + \frac{1-x}{x^2+1} = x + \frac{1}{x^2+1} - \frac{x}{x^2+1}$$

Integrate term by term: $\int x\,dx = \dfrac{x^2}{2}$; $\int \dfrac{1}{x^2+1}\,dx = \arctan x$; $\int \dfrac{x}{x^2+1}\,dx = \dfrac{1}{2}\ln(x^2+1)$ (substitute $u=x^2+1$).

$$\int \frac{x^3+1}{x^2+1}\,dx = \frac{x^2}{2} + \arctan x - \frac{1}{2}\ln(x^2+1) + C$$

**Why the others are wrong:** (B) drops the polynomial-division term $x^2/2$ entirely — the mistake of decomposing an improper fraction as if it were already proper. (C) has a factor-of-2 slip on the log term and drops the $\arctan x$ piece. (D) is not an antiderivative of the integrand at all — differentiating it does not return $\frac{x^3+1}{x^2+1}$.

</details>
