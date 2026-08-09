---
id: taylor-laurent.micro-exercise
concept_id: taylor-laurent
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
estimated_minutes: 2
---

The Taylor series expansion of $f(z) = \cos z$ around $z_0 = 0$ is:

- **(A)** $1 - \frac{z^2}{2!} + \frac{z^4}{4!} - \frac{z^6}{6!} + \cdots$
- **(B)** $z - \frac{z^3}{3!} + \frac{z^5}{5!} - \frac{z^7}{7!} + \cdots$
- **(C)** $1 + z + \frac{z^2}{2!} + \frac{z^3}{3!} + \cdots$
- **(D)** $\sum_{n=1}^{\infty} \frac{z^n}{n}$

<details>
<summary>Answer</summary>

**A**. The Taylor series of $\cos z$ is found using the derivatives:
$f(z) = \cos z \Rightarrow f(0) = 1$
$f'(z) = -\sin z \Rightarrow f'(0) = 0$
$f''(z) = -\cos z \Rightarrow f''(0) = -1$
$f'''(z) = \sin z \Rightarrow f'''(0) = 0$
$f^{(4)}(z) = \cos z \Rightarrow f^{(4)}(0) = 1$
The pattern repeats: even derivatives give $\pm 1$ and odd derivatives give $0$.
By the Taylor formula $f(z) = \sum_{n=0}^{\infty} \frac{f^{(n)}(0)}{n!} z^n$, we get:
$\cos z = 1 - \frac{z^2}{2!} + \frac{z^4}{4!} - \frac{z^6}{6!} + \cdots = \sum_{n=0}^{\infty} \frac{(-1)^n z^{2n}}{(2n)!}$

</details>
