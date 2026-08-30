---
# Alternative body for recurrence-relations.worked_example, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: recurrence-relations.worked_example.shaken
concept_id: recurrence-relations
atom_type: worked_example
bloom_level: 3
difficulty: 0.4
exam_ids: ["*"]
scaffold_fade: true
variant_of: recurrence-relations.worked-example
for_stance: shaken
---

Solve $a_n=a_{n-1}+a_{n-2}$ with $a_1=2,\ a_2=3$; find $a_5$.

Start from the given values: $a_1=2$, $a_2=3$.

Compute the next term: $a_3=a_2+a_1=3+2=5$.

Compute the next: $a_4=a_3+a_2=5+3=8$.

Compute the last one needed: $a_5=a_4+a_3=8+5=13$.

Answer: $a_5=13$.

Separately, the closed form for the same recurrence starts from its characteristic equation: $r^2-r-1=0$. Solve with the quadratic formula: $r=\frac{1\pm\sqrt5}{2}$. Name the two roots: $\phi=\frac{1+\sqrt5}{2}\approx1.618$ and $\psi=\frac{1-\sqrt5}{2}\approx-0.618$. For small $n$ like $5$, the four additions above are faster than fitting $A$ and $B$ to those roots.

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

Iterating beats solving the characteristic equation whenever the term you need is only a few steps ahead; save the closed form for when $n$ is large or symbolic.
