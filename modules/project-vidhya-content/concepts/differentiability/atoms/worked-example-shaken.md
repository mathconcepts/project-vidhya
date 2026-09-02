---
# Alternative body for differentiability.worked_example, served when the
# learner stance is `shaken`. Same steps, concrete-first, full arithmetic.
id: differentiability.worked_example.shaken
concept_id: differentiability
atom_type: worked_example
bloom_level: 3
difficulty: 0.2
exam_ids: ["*"]
scaffold_fade: true
variant_of: differentiability.worked_example
for_stance: shaken
---

Same problem: $f(x)=x^2$ for $x<1$, $f(x)=ax+b$ for $x\ge1$. Find $a,b$. Two checks, done in turn.

**Check 1 — continuity.** $\lim_{x\to1^-}x^2=1$. $f(1)=a+b$. Set equal: $a+b=1$. Call this (i).

**Check 2 — matching slopes.** Left piece's derivative: $2x$, so at $x=1$: $2$. Right piece's derivative: $a$. Set equal: $a=2$. Call this (ii).

**Solve.** From (ii): $a=2$. Substitute into (i): $2+b=1$, so $b=-1$.

$$
\boxed{a=2,\ b=-1}
$$

**Check.** At $x=1.1$: right piece gives $2(1.1)-1=1.2$. Left piece's tangent line at $x=1$ (slope $2$) gives $1+2(0.1)=1.2$. Match.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: find a, b so f(x)=x^2 (x<1), f(x)=ax+b (x>=1) is differentiable at x=1","steps":[{"prompt":"First impose continuity at x=1. What equation does that give you?","hint":"Set the limit of x^2 as x to 1 equal to a(1)+b.","answer":"lim_{x to 1^-} x^2 = 1, and f(1) = a + b, so continuity requires a + b = 1."},{"prompt":"Now impose matching one-sided derivatives at x=1. What equation does THIS give you?","hint":"Differentiate each piece separately: d/dx(x^2) = 2x; d/dx(ax+b) = a.","answer":"Left derivative at x=1 is 2(1)=2. Right derivative is a (constant). Matching requires a = 2."},{"prompt":"Solve the two equations together. What are a and b?","hint":"Substitute a = 2 into a + b = 1.","answer":"a = 2, and b = 1 - 2 = -1, so \\boxed{a=2,\\ b=-1}."}]}
```
