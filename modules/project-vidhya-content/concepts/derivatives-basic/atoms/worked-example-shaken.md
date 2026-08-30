---
# Alternative body for derivatives-basic.worked_example, served when the
# learner stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: derivatives-basic.worked_example.shaken
concept_id: derivatives-basic
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: derivatives-basic-worked-example
for_stance: shaken
---

**Given:** $y=x^3\ln x-e^{2x}\sin x$. Differentiate term by term.

**Term 1 — $x^3\ln x$.** Let $u=x^3,\,v=\ln x$, so $u'=3x^2,\,v'=\frac1x$. Product rule: $u'v+uv'=3x^2\ln x+x^3\cdot\frac1x=3x^2\ln x+x^2$.

**Term 2 — $e^{2x}\sin x$.** Let $u=e^{2x},\,v=\sin x$. Chain rule on $u$ gives $u'=2e^{2x}$; $v'=\cos x$. Product rule: $u'v+uv'=2e^{2x}\sin x+e^{2x}\cos x$.

**Combine**, keeping the minus sign from the original: $\dfrac{dy}{dx}=(3x^2\ln x+x^2)-e^{2x}(2\sin x+\cos x)$.

**Answer:** $\dfrac{dy}{dx}=x^2(3\ln x+1)-e^{2x}(2\sin x+\cos x)$.

**Check term 2 at $x=0$:** the formula gives $2e^0\sin0+e^0\cos0=0+1=1$. Directly from the function itself, $e^{2x}\sin x$ is about $0.001002$ at $x=0.001$ and about $-0.000998$ at $x=-0.001$; slope $\approx\dfrac{0.001002-(-0.000998)}{0.002}=1.000$. Matches.

---

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: product and chain rule on x^3 ln(x) - e^(2x) sin(x)","steps":[{"prompt":"Which differentiation rule applies to x^3·ln(x), and what are u and v?","hint":"When a function is a product of two distinct functions, use the Product Rule: (uv)' = u'v + uv'.","answer":"Product Rule. Let u = x^3 (so u' = 3x^2) and v = ln(x) (so v' = 1/x)."},{"prompt":"What is the derivative of e^(2x)? Which rule do you need beyond the basic exponential rule?","hint":"e^(2x) is a composite function: the outer function is e^(·) and the inner function is 2x.","answer":"Chain Rule gives d/dx[e^(2x)] = e^(2x)·2 = 2e^(2x). The factor 2 comes from differentiating the inner function 2x."},{"prompt":"State the final answer for dy/dx in fully simplified form.","hint":"Combine both differentiated terms, remembering to subtract the second term as it appears with a minus sign in the original y.","answer":"dy/dx = x^2(3 ln x + 1) - e^(2x)(2 sin x + cos x). Factor x^2 from the first part and e^(2x) from the second."}]}
```
