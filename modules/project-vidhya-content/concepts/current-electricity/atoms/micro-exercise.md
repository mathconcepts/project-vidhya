---
id: current-electricity.micro-exercise
concept_id: current-electricity
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.4
estimated_minutes: 2
exam_ids: ["*"]
---

Three resistors, $2\ \Omega$, $3\ \Omega$, and $6\ \Omega$, are all connected in **parallel** across a $12\ \text{V}$ source. What is the total current drawn from the source?

A) $1\ \text{A}$
B) $2\ \text{A}$
C) $6\ \text{A}$
D) $12\ \text{A}$
E) $22\ \text{A}$

<details>
<summary>Answer</summary>

**Correct answer: D) $12\ \text{A}$.**

$\dfrac{1}{R_p}=\dfrac{1}{2}+\dfrac{1}{3}+\dfrac{1}{6}=\dfrac{3}{6}+\dfrac{2}{6}+\dfrac{1}{6}=\dfrac{6}{6}=1$, so $R_p=1\ \Omega$. Total current: $I=\dfrac{V}{R_p}=\dfrac{12}{1}=12\ \text{A}$.

**Why the others fail:**
- A) $1\ \text{A}$ is the equivalent resistance ($1\ \Omega$), mistaken for the current.
- B) $2\ \text{A}$ comes from treating the smallest resistor ($2\ \Omega$) as if it decided the whole current by itself: $12/6$ style confusion.
- C) $6\ \text{A}$ comes from wrongly adding the resistors in series first ($2+3+6=11$, rounded loosely) instead of combining them in parallel.
- E) $22\ \text{A}$ comes from summing the three individual branch currents *incorrectly* (adding $6+4+2=12$ correctly gives D — this wrong total comes from a slip in one branch's current, e.g. using $12/2=6$, $12/3=4$, and mistakenly $12/1=12$ for the third branch instead of $12/6=2$, giving $6+4+12=22$).

</details>

