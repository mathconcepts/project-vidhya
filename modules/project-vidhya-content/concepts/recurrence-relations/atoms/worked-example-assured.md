---
# Alternative body for recurrence-relations.worked_example, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: recurrence-relations.worked_example.assured
concept_id: recurrence-relations
atom_type: worked_example
bloom_level: 3
difficulty: 0.4
exam_ids: ["*"]
scaffold_fade: true
variant_of: recurrence-relations.worked-example
for_stance: assured
---

$a_n=a_{n-1}+a_{n-2}$, $a_1=2,a_2=3\Rightarrow a_5$: iterate rather than solve for $A,B$ — $a_3=5,a_4=8,a_5=13$ in three additions, faster than fitting the closed form for a single small-$n$ query.

Characteristic equation $r^2-r-1=0$ gives $r=\frac{1\pm\sqrt5}{2}$, the golden-ratio pair — worth recognizing on sight, since any second-order recurrence with coefficients $1,1$ produces exactly these roots, not just the classic rabbit-pairs phrasing.

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

The general solution $a_n=A\phi^n+B\psi^n$ is only worth building when $n$ is large or symbolic — fitting $A,B$ from two initial conditions costs more arithmetic than five or six iterations do. Route selection, not derivation skill, is what separates a fast answer from a correct-but-slow one here.
