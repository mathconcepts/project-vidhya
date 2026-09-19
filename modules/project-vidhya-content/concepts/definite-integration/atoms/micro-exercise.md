---
id: definite-integration.micro_exercise
concept_id: definite-integration
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.4
estimated_minutes: 2
exam_ids: ["*"]
---

$\displaystyle\int_{-2}^{2} x^3\cos x\,dx$ equals:

(A) $0$
(B) $2\displaystyle\int_0^2 x^3\cos x\,dx$
(C) A positive number, computable only by integrating by parts three times
(D) Cannot be determined without a calculator
(E) None of these

<details>
<summary>Answer</summary>

**Correct answer: (A) — $0$**

Check whether the integrand is odd or even: $f(-x) = (-x)^3\cos(-x) = -x^3\cos x = -f(x)$ (using $\cos(-x)=\cos x$). The integrand is a product of an odd function ($x^3$) and an even function ($\cos x$), which is always odd.

The interval $[-2,2]$ is symmetric about $0$, and an odd function integrates to exactly $0$ over any interval symmetric about the origin — no antiderivative, no integration by parts, no calculator required.

**Why the others are wrong:** (B) is the doubling rule for an EVEN function, not an odd one — applying it here is exactly Trap 3 from this concept's common traps. (C) and (D) both assume the integral needs to be computed directly; recognising the odd-function property answers the question before any computation starts.

</details>
