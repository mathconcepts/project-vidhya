---
id: mean-value-theorems.exam-pattern
concept_id: mean-value-theorems
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.45
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **NAT questions typically ask for the value of $c$ itself** — plug in the given $f(x)$ and interval, compute the average slope, solve $f'(c) = \text{slope}$, and report the numeric root that lies inside the open interval.

  Example: for $f(x) = x^2$ on $[1,3]$, average slope $= \frac{9-1}{2} = 4$, and $f'(c) = 2c = 4$ gives $c = 2$ directly.

- **MCQ "does the theorem apply" questions test the hypotheses, not the computation.** A function with a corner (like $|x|$) or a jump discontinuity inside the interval is the classic distractor: the algebra to "solve for $c$" would run fine on paper, but the theorem's guarantee never applied in the first place.

- **Rolle's-in-disguise problems hide $f(a) = f(b)$ inside the given numbers** — check this first; when it holds, the average slope is $0$ and the problem reduces to solving $f'(c) = 0$, skipping a step.

- **Time budget:** recognizing which hypothesis check applies and solving a single-variable equation for $c$ should cost under 90 seconds for a GATE-style polynomial. Longer than that usually means the wrong theorem was picked, or an endpoint root was mistaken for a valid answer.
