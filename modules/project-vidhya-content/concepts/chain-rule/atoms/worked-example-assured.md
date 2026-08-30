---
# Alternative body for chain-rule.worked_example, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: chain-rule.worked_example.assured
concept_id: chain-rule
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: chain-rule-worked-example
for_stance: assured
---

Skip $u$ entirely: for $y=e^{g(x)}$, $\dfrac{dy}{dx}=e^{g(x)}\cdot g'(x)$ directly. With $g(x)=\cos x$: $\dfrac{dy}{dx}=e^{\cos x}\cdot(-\sin x)$ — one line, no auxiliary variable to name or substitute back.

**Answer:** $\dfrac{dy}{dx}=-\sin(x)\,e^{\cos x}$.

The same shortcut chains through any number of layers: each layer contributes one factor, evaluated at *its own* input, multiplied outer-to-inner. For $y=\ln(\sin(x^2))$: $\dfrac{dy}{dx}=\dfrac{1}{\sin(x^2)}\cdot\cos(x^2)\cdot2x=2x\cot(x^2)$ — three factors, none requiring a named substitution.

The shortcut is only valid where every layer is differentiable *at the value the next layer actually hands it*. For $\ln(\sin(x^2))$ that means $\sin(x^2)>0$, since $\ln$ is not defined — let alone differentiable — at or below $0$. Missing this domain restriction is the real mark-loser: the algebra above is correct wherever it is defined, but the function itself is not defined everywhere the algebra runs.

---

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: differentiating y = e^cos(x) with the chain rule","steps":[{"prompt":"For $y = e^{\\cos(x)}$, identify the outer function $f(u)$ and inner function $g(x)$. Write down their individual derivatives $f'(u)$ and $g'(x)$.","hint":"The outer function is whatever is 'applied last'. Here, $e^{\\square}$ is applied last, so $f(u) = e^u$. The inner function is $\\cos(x)$.","answer":"Outer: $f(u) = e^u$, so $f'(u) = e^u$. Inner: $g(x) = \\cos x$, so $g'(x) = -\\sin x$."},{"prompt":"Combine using the chain rule to find $\\frac{dy}{dx}$. Don't forget to substitute back $u = \\cos(x)$.","hint":"Chain rule: $\\frac{dy}{dx} = f'(g(x)) \\cdot g'(x)$. Evaluate $f'$ at the inner function, then multiply by the inner derivative.","answer":"$\\frac{dy}{dx} = e^{\\cos(x)} \\cdot (-\\sin x) = \\boxed{-\\sin(x)\\, e^{\\cos(x)}}$."}]}
```
