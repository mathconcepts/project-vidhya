---
# Alternative body for product-quotient-rule.worked_example, served when
# the learner stance is `shaken`. The base file is what a steady student
# reads. See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: product-quotient-rule.worked_example.shaken
concept_id: product-quotient-rule
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: product-quotient-rule-worked-example
for_stance: shaken
---

**Part A — Given:** $f(x)=x^2e^x$.

**Step 1.** Name the factors: $u=x^2$, $v=e^x$.

**Step 2.** Differentiate each on its own: $u'=2x$, $v'=e^x$.

**Step 3.** Apply the product rule: $f'=u'v+uv'=2xe^x+x^2e^x$.

**Step 4.** Factor out $e^x$: $f'=e^x(2x+x^2)=xe^x(x+2)$.

**Answer (A):** $f'(x)=xe^x(x+2)$.

**Part B — Given:** $g(x)=\dfrac{\sin x}{x}$.

**Step 5.** Name numerator and denominator: $u=\sin x$, $v=x$.

**Step 6.** Differentiate each on its own: $u'=\cos x$, $v'=1$.

**Step 7.** Apply the quotient rule: $g'=\dfrac{u'v-uv'}{v^2}=\dfrac{x\cos x-\sin x}{x^2}$.

**Answer (B):** $g'(x)=\dfrac{x\cos x-\sin x}{x^2}$.

**Check it (A):** at $x=1$, expanding directly: $f'(x)=2xe^x+x^2e^x$ gives $2e+e=3e$; the factored form $xe^x(x+2)$ at $x=1$ gives $1\cdot e\cdot3=3e$. Matches.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: product rule on x²eˣ and quotient rule on sin(x)/x","steps":[{"prompt":"To differentiate f(x) = x²·eˣ using the product rule, what are u and v?","hint":"Identify the two factors being multiplied. Neither should be a constant.","answer":"u = x² and v = eˣ"},{"prompt":"What is u' (derivative of x²) and v' (derivative of eˣ)?","hint":"Power rule for x², and recall that eˣ is its own derivative.","answer":"u' = 2x and v' = eˣ"},{"prompt":"Apply the product rule f' = u'v + uv'. What is f'(x) before simplifying?","hint":"Substitute u=x², v=eˣ, u'=2x, v'=eˣ into the formula.","answer":"f'(x) = (2x)(eˣ) + (x²)(eˣ) = 2x·eˣ + x²·eˣ"},{"prompt":"Factor the result fully. What is the simplified form of f'(x)?","hint":"Both terms share a common factor of eˣ. Can you factor further?","answer":"f'(x) = eˣ(2x + x²) = x·eˣ(x + 2)"}]}
```
