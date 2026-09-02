---
id: laplace-applications.retrieval-prompt
concept_id: laplace-applications
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
estimated_minutes: 3
---

Before checking, try to solve the ODE $y'' + 4y' + 3y = e^{-t}$ with $y(0) = 0$ and $y'(0) = 1$ using Laplace transforms.

- **(A)** $y(t) = \frac{1}{4}e^{-t} + \frac{1}{2}te^{-t} - \frac{1}{4}e^{-3t}$
- **(B)** $y(t) = \frac{1}{2}e^{-t} - \frac{1}{2}e^{-3t}$
- **(C)** $y(t) = \frac{1}{4}e^{-t} + te^{-t} - \frac{1}{4}e^{-3t}$
- **(D)** $y(t) = -\frac{1}{4}e^{-t} + \frac{1}{2}te^{-t} + \frac{1}{4}e^{-3t}$

<details>
<summary>Answer</summary>

**A**. Transform: $s^2Y(s) - s(0) - 1 + 4[sY(s) - 0] + 3Y(s) = \frac{1}{s+1}$, so $(s^2+4s+3)Y(s) = 1 + \frac{1}{s+1} = \frac{s+2}{s+1}$. Factor $s^2+4s+3=(s+1)(s+3)$:

$$Y(s) = \frac{s+2}{(s+1)^2(s+3)}$$

The repeated factor $(s+1)^2$ forces the form $\dfrac{A}{s+1}+\dfrac{B}{(s+1)^2}+\dfrac{C}{s+3}$. Multiplying through: $s+2 = A(s+1)(s+3) + B(s+3) + C(s+1)^2$. At $s=-1$: $1 = B(2) \Rightarrow B=\frac12$. At $s=-3$: $-1 = C(4) \Rightarrow C=-\frac14$. Matching the $s^2$ coefficient: $0 = A+C \Rightarrow A=\frac14$ (checked against the constant term: $2 = 3A+3B+C = \frac34+\frac32-\frac14=2$ ✓). So

$$Y(s) = \frac{1/4}{s+1} + \frac{1/2}{(s+1)^2} - \frac{1/4}{s+3}$$

Inverting term by term with $\mathcal{L}^{-1}\{1/(s+a)\}=e^{-at}$ and $\mathcal{L}^{-1}\{1/(s+a)^2\}=te^{-at}$:

$$y(t) = \frac14 e^{-t} + \frac12 te^{-t} - \frac14 e^{-3t}$$

Check the initial conditions directly: $y(0)=\frac14-\frac14=0$ ✓. The repeated pole at $s=-1$ is what produces the $te^{-t}$ term — dropping $B/(s+1)^2$ entirely (option B) or copying the wrong coefficient onto it (option C, which uses $B=1$ instead of $\frac12$) are the two failure modes this exercise targets.

</details>
