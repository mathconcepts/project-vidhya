---
id: recurrence-relations.worked-example
concept_id: recurrence-relations
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
---

# Worked Example: Solving a Linear Recurrence

## Problem (GATE Style)

The number of binary strings of length $n$ with no two consecutive 1s is given by the recurrence:
$$a_n = a_{n-1} + a_{n-2}$$
with initial conditions $a_1 = 2$ and $a_2 = 3$.

Find $a_5$.

## Solution

**Step 1: Understand the recurrence**

This says: the count for strings of length $n$ equals the count for length $n-1$ (append 0 to any valid string of length $n-1$) plus the count for length $n-2$ (append 01 to any valid string of length $n-2$).

**Step 2: Identify the type**

- Homogeneous linear recurrence, order 2
- Constant coefficients: $c_1 = 1$, $c_2 = 1$
- No non-homogeneous term

**Step 3: Solve the characteristic equation**

$$r^2 - r - 1 = 0$$
$$r = \frac{1 \pm \sqrt{5}}{2}$$

Let $\phi = \frac{1 + \sqrt{5}}{2} \approx 1.618$ (golden ratio) and $\psi = \frac{1 - \sqrt{5}}{2} \approx -0.618$

**Step 4: General solution**

$$a_n = A\phi^n + B\psi^n$$

**Step 5: Apply initial conditions**

From $a_1 = 2$:
$$A\phi + B\psi = 2$$

From $a_2 = 3$:
$$A\phi^2 + B\psi^2 = 3$$

Solving (omitting algebra): $A = \frac{1}{\sqrt{5}}$ and $B = -\frac{1}{\sqrt{5}}$

**Step 6: Compute $a_5$**

$$a_5 = \frac{1}{\sqrt{5}}(\phi^5 - \psi^5)$$

Computing numerically: $\phi^5 \approx 11.09$ and $\psi^5 \approx -0.09$

$$a_5 = \frac{1}{\sqrt{5}}(11.09 + 0.09) \approx \frac{11.18}{2.236} \approx 5$$

**Or, compute iteratively** (faster for exam):
- $a_1 = 2$
- $a_2 = 3$
- $a_3 = 2 + 3 = 5$
- $a_4 = 3 + 5 = 8$
- $a_5 = 5 + 8 = 13$

**Answer: $a_5 = 13$**

---

```interactive-spec
{
  "v": 1,
  "kind": "guided_walkthrough",
  "title": "Walk through: Binary strings with no consecutive 1s",
  "steps": [
    {
      "prompt": "What does $a_n = a_{n-1} + a_{n-2}$ mean conceptually?",
      "hint": "Think about what happens when you append a bit to a valid string.",
      "answer": "If the last bit is 0, the first $n-1$ bits can be any valid string of length $n-1$. If the last bit is 1, the second-to-last must be 0, so the first $n-2$ bits can be any valid string of length $n-2$. Total: $a_{n-1} + a_{n-2}$."
    },
    {
      "prompt": "Write the characteristic equation for $a_n = a_{n-1} + a_{n-2}$.",
      "hint": "Assume $a_n = r^n$ and substitute.",
      "answer": "$r^n = r^{n-1} + r^{n-2}$ → divide by $r^{n-2}$ → $r^2 = r + 1$ → $r^2 - r - 1 = 0$"
    },
    {
      "prompt": "What are the roots of $r^2 - r - 1 = 0$?",
      "hint": "Use the quadratic formula: $r = \\frac{1 \\pm \\sqrt{1+4}}{2}$",
      "answer": "$r = \\frac{1 \\pm \\sqrt{5}}{2}$, namely $\\phi = \\frac{1+\\sqrt{5}}{2}$ (golden ratio) and $\\psi = \\frac{1-\\sqrt{5}}{2}$"
    },
    {
      "prompt": "Compute $a_3, a_4, a_5$ using the recurrence and initial conditions $a_1=2, a_2=3$.",
      "hint": "Apply $a_n = a_{n-1} + a_{n-2}$ iteratively.",
      "answer": "$a_3 = 2+3=5$; $a_4 = 3+5=8$; $a_5 = 5+8=13$"
    }
  ],
  "caption": "Exam insight: For Fibonacci-like recurrences, iterative computation often beats solving the characteristic equation when $n$ is small. Recognize the golden ratio root — it signals exponential growth."
}
```
```

---

**Summary:** Recurrence Relations require:
1. **Identification** (order, homogeneity)
2. **Characteristic equation** solution
3. **General form** construction
4. **Initial condition** application

For exam speed, when $n \leq 5$, compute iteratively. For large $n$, use the closed form.

DONE:recurrence-relations
