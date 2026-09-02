---
# Alternative body for continuity.worked_example, served when the learner
# stance is `assured`. The fenced walkthrough is copied verbatim from the
# base atom so the widget cannot drift between variants.
id: continuity.worked_example.assured
concept_id: continuity
atom_type: worked_example
bloom_level: 3
difficulty: 0.2
exam_ids: ["*"]
scaffold_fade: true
variant_of: continuity.worked_example
for_stance: assured
---

$f(x)=\dfrac{x^3-1}{x-1}$, $f(1)=5$. Simplifying to $x^2+x+1$ and taking the limit gives $3$ — routine.

The distinction worth the marks: $f(1)$ was **given** as $5$, not left undefined. It's tempting to only check "does the limit exist" and stop, since that's the harder-feeling step — but the actual failure here is condition (3): the limit ($3$) disagrees with the *given* $f(1)$ ($5$). Both individually exist; they just don't match.

$$
\boxed{\text{Removable — redefine } f(1)=3}
$$

Don't confuse this with a jump: a jump needs the *one-sided limits themselves* to disagree with each other. Here both one-sided limits agree with each other (at $3$) and disagree only with the assigned $f(1)$ — that's what makes it removable, not a jump.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: is f(x) = (x^3-1)/(x-1), f(1)=5, continuous at x=1?","steps":[{"prompt":"Simplify (x^3-1)/(x-1) for x != 1. What single expression does it reduce to?","hint":"Factor x^3 - 1 as a difference of cubes: (x-1)(x^2+x+1).","answer":"x^2 + x + 1, valid for x != 1."},{"prompt":"What is lim_{x to 1} f(x), and does it equal f(1) = 5?","hint":"Substitute x = 1 into the simplified expression x^2 + x + 1.","answer":"The limit is 1 + 1 + 1 = 3, which does NOT equal f(1) = 5 — condition (3) for continuity fails."},{"prompt":"Since the limit exists and is finite but disagrees with f(1), what type of discontinuity is this, and what value fixes it?","hint":"A finite, existing limit that just doesn't match f(a) is the removable case.","answer":"A removable discontinuity — redefining \\boxed{f(1)=3} makes f continuous at x=1."}]}
```
