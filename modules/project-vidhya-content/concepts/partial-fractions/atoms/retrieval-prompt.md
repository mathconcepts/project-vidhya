---
id: partial-fractions.retrieval-prompt
concept_id: partial-fractions
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
estimated_minutes: 3
---

Integrate $\int \frac{3x + 5}{x^2 + 3x + 2} dx$.

- **(A)** $\ln|x+1| + 2\ln|x+2| + C$
- **(B)** $2\ln|x+1| + \ln|x+2| + C$
- **(C)** $\ln|x^2 + 3x + 2| + C$
- **(D)** $\frac{3}{2}\ln|x^2 + 3x + 2| + C$

<details>
<summary>Answer</summary>

**B**. Factor: $x^2 + 3x + 2 = (x+1)(x+2)$

Decompose: $\frac{3x+5}{(x+1)(x+2)} = \frac{A}{x+1} + \frac{B}{x+2}$

$3x + 5 = A(x+2) + B(x+1)$

At $x = -1$: $2 = A(1) \Rightarrow A = 2$
At $x = -2$: $-1 = B(-1) \Rightarrow B = 1$

$$\int \frac{2}{x+1} dx + \int \frac{1}{x+2} dx = 2\ln|x+1| + \ln|x+2| + C$$

</details>
