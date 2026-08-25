---
id: numerical-error-analysis.micro-exercise
concept_id: numerical-error-analysis
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.22
exam_ids: ["*"]
estimated_minutes: 2
---

The true value of $\pi$ is $3.14159\ldots$, and it is approximated as $3.14$. What is the percentage error, to 2 decimal places?

- **(A)** 0.05%
- **(B)** 0.16%
- **(C)** 1.59%
- **(D)** 5.06%

<details>
<summary>Answer</summary>

**A**. Compute the absolute error first:

$$E_a = |3.14159 - 3.14| = 0.00159$$

Then the relative error, dividing by the true value:

$$E_r = \frac{0.00159}{3.14159} \approx 0.000506$$

$$E_p = E_r \times 100\% \approx \boxed{0.05\%}$$

B) is the trap of reporting $E_a \times 100 = 0.159\%\!$ ≈ 0.16% directly — that's the absolute error scaled by 100, without first dividing by the true value to make it a *relative* error.

C) comes from misplacing a decimal in the relative-error calculation (treating $0.0159$ as the relative error instead of $0.00159$).

D) comes from converting the already-computed relative error to a percentage a second time — multiplying by 100 twice ($0.000506 \times 10{,}000$ instead of $\times 100$).

The correct answer is A.

</details>
