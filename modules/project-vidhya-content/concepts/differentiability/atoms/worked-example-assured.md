---
# Alternative body for differentiability.worked_example, served when the
# learner stance is `assured`. The fenced walkthrough is copied verbatim
# from the base atom so the widget cannot drift between variants.
id: differentiability.worked_example.assured
concept_id: differentiability
atom_type: worked_example
bloom_level: 3
difficulty: 0.2
exam_ids: ["*"]
scaffold_fade: true
variant_of: differentiability.worked_example
for_stance: assured
---

$f(x)=x^2$ ($x<1$), $ax+b$ ($x\ge1$), differentiable at $x=1$: continuity gives $a+b=1$; matching slopes ($2x$ at $x=1$ versus constant $a$) gives $a=2$, so $b=-1$ — mechanical once both conditions are written down.

What actually costs marks: **two** equations are required, not one. A student who only imposes continuity gets a family of valid-looking $(a,b)$ pairs and stops one condition short of pinning down a unique answer; a student who only imposes matching slopes never checks whether the pieces even meet at $x=1$ at all. Both conditions are independent constraints — neither implies the other.

$$
\boxed{a=2,\ b=-1}
$$

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: find a, b so f(x)=x^2 (x<1), f(x)=ax+b (x>=1) is differentiable at x=1","steps":[{"prompt":"First impose continuity at x=1. What equation does that give you?","hint":"Set the limit of x^2 as x to 1 equal to a(1)+b.","answer":"lim_{x to 1^-} x^2 = 1, and f(1) = a + b, so continuity requires a + b = 1."},{"prompt":"Now impose matching one-sided derivatives at x=1. What equation does THIS give you?","hint":"Differentiate each piece separately: d/dx(x^2) = 2x; d/dx(ax+b) = a.","answer":"Left derivative at x=1 is 2(1)=2. Right derivative is a (constant). Matching requires a = 2."},{"prompt":"Solve the two equations together. What are a and b?","hint":"Substitute a = 2 into a + b = 1.","answer":"a = 2, and b = 1 - 2 = -1, so \\boxed{a=2,\\ b=-1}."}]}
```
