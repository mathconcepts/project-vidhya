---
# Alternative body for product-quotient-rule.worked_example, served when
# the learner stance is `assured`. The base file is what a steady student
# reads. See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: product-quotient-rule.worked_example.assured
concept_id: product-quotient-rule
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: product-quotient-rule-worked-example
for_stance: assured
---

$f'(x)=e^x(2x+x^2)=xe^x(x+2)$, product rule applied and factored in one line: $u=x^2,v=e^x\Rightarrow u'v+uv'=2xe^x+x^2e^x$, factor $e^x$ out immediately since exam options are always in factored form.

$g(x)=\sin x\cdot x^{-1}$ rewrites the quotient as a product: $g'=\cos x\cdot x^{-1}+\sin x\cdot(-x^{-2})=\dfrac{\cos x}{x}-\dfrac{\sin x}{x^2}=\dfrac{x\cos x-\sin x}{x^2}$ — same answer as the quotient rule, reached without ever writing a $v^2$ denominator from scratch.

**Answer:** $f'(x)=xe^x(x+2)$; $g'(x)=\dfrac{x\cos x-\sin x}{x^2}$.

The pattern in Part A generalizes directly: differentiating $x^ne^x$ always returns $e^x$ times a degree-$n$ polynomial, since each product-rule pass drops the polynomial's degree by one while leaving $e^x$ untouched — useful for predicting the *shape* of a higher-order derivative before grinding through it.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: product rule on x²eˣ and quotient rule on sin(x)/x","steps":[{"prompt":"To differentiate f(x) = x²·eˣ using the product rule, what are u and v?","hint":"Identify the two factors being multiplied. Neither should be a constant.","answer":"u = x² and v = eˣ"},{"prompt":"What is u' (derivative of x²) and v' (derivative of eˣ)?","hint":"Power rule for x², and recall that eˣ is its own derivative.","answer":"u' = 2x and v' = eˣ"},{"prompt":"Apply the product rule f' = u'v + uv'. What is f'(x) before simplifying?","hint":"Substitute u=x², v=eˣ, u'=2x, v'=eˣ into the formula.","answer":"f'(x) = (2x)(eˣ) + (x²)(eˣ) = 2x·eˣ + x²·eˣ"},{"prompt":"Factor the result fully. What is the simplified form of f'(x)?","hint":"Both terms share a common factor of eˣ. Can you factor further?","answer":"f'(x) = eˣ(2x + x²) = x·eˣ(x + 2)"}]}
```
