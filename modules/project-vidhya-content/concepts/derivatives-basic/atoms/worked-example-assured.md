---
# Alternative body for derivatives-basic.worked_example, served when the
# learner stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: derivatives-basic.worked_example.assured
concept_id: derivatives-basic
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: derivatives-basic-worked-example
for_stance: assured
---

Both terms fall to the same shortcut: (derivative of first)(second) + (first)(derivative of second), no need to name $u,v$ once the pattern is automatic. $x^3\ln x\to3x^2\ln x+x^2$; $e^{2x}\sin x\to2e^{2x}\sin x+e^{2x}\cos x$, chain rule folded into the exponential factor without a separate step.

**Answer:** $\dfrac{dy}{dx}=x^2(3\ln x+1)-e^{2x}(2\sin x+\cos x)$.

The $n$-th derivative pattern is the real time-saver on this concept: $\dfrac{d^n}{dx^n}\sin(ax+b)=a^n\sin\!\left(ax+b+\dfrac{n\pi}{2}\right)$, each differentiation multiplying by $a$ and advancing the phase by $\pi/2$ — valid for any real $a$, including negative or fractional, since the phase shift does the work, not repeated explicit differentiation.

The mark-loser hiding in term $2$: $\frac{d}{dx}[e^{2x}]=e^{2x}$ is the single most common slip on this pattern — the chain rule's factor of $2$ from the inner $2x$ is silent unless named explicitly. It costs the same mark whether the exponent is $2x$, $-x$, or $\frac{x}{3}$: whatever multiplies $x$ inside the exponent survives outside as a multiplicative factor, always.

---

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: product and chain rule on x^3 ln(x) - e^(2x) sin(x)","steps":[{"prompt":"Which differentiation rule applies to x^3·ln(x), and what are u and v?","hint":"When a function is a product of two distinct functions, use the Product Rule: (uv)' = u'v + uv'.","answer":"Product Rule. Let u = x^3 (so u' = 3x^2) and v = ln(x) (so v' = 1/x)."},{"prompt":"What is the derivative of e^(2x)? Which rule do you need beyond the basic exponential rule?","hint":"e^(2x) is a composite function: the outer function is e^(·) and the inner function is 2x.","answer":"Chain Rule gives d/dx[e^(2x)] = e^(2x)·2 = 2e^(2x). The factor 2 comes from differentiating the inner function 2x."},{"prompt":"State the final answer for dy/dx in fully simplified form.","hint":"Combine both differentiated terms, remembering to subtract the second term as it appears with a minus sign in the original y.","answer":"dy/dx = x^2(3 ln x + 1) - e^(2x)(2 sin x + cos x). Factor x^2 from the first part and e^(2x) from the second."}]}
```
