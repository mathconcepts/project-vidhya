---
# Alternative body for chain-rule.worked_example, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: chain-rule.worked_example.shaken
concept_id: chain-rule
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: chain-rule.worked_example
for_stance: shaken
---

**Given:** differentiate $y=e^{\cos x}$.

**Step 1.** Name the outer piece only: $f(u)=e^{u}$.

**Step 2.** Name the inner piece only: $u=g(x)=\cos x$.

**Step 3.** Differentiate the outer piece, in terms of $u$: $f'(u)=e^{u}$.

**Step 4.** Differentiate the inner piece, in terms of $x$: $g'(x)=-\sin x$.

**Step 5.** Multiply the two pieces, then substitute $u=\cos x$ back in: $\dfrac{dy}{dx}=e^{u}\cdot(-\sin x)=e^{\cos x}\cdot(-\sin x)$.

**Answer:** $\dfrac{dy}{dx}=-\sin(x)\,e^{\cos x}$.

**Check it:** at $x=0$, $\cos 0=1$ and $\sin 0=0$, so the answer gives slope $0$ there — and $y=e^{\cos x}$ is largest exactly at $x=0$, where a maximum's slope must be $0$.

---

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: differentiating y = e^cos(x) with the chain rule","steps":[{"prompt":"For $y = e^{\\cos(x)}$, identify the outer function $f(u)$ and inner function $g(x)$. Write down their individual derivatives $f'(u)$ and $g'(x)$.","hint":"The outer function is whatever is 'applied last'. Here, $e^{\\square}$ is applied last, so $f(u) = e^u$. The inner function is $\\cos(x)$.","answer":"Outer: $f(u) = e^u$, so $f'(u) = e^u$. Inner: $g(x) = \\cos x$, so $g'(x) = -\\sin x$."},{"prompt":"Combine using the chain rule to find $\\frac{dy}{dx}$. Don't forget to substitute back $u = \\cos(x)$.","hint":"Chain rule: $\\frac{dy}{dx} = f'(g(x)) \\cdot g'(x)$. Evaluate $f'$ at the inner function, then multiply by the inner derivative.","answer":"$\\frac{dy}{dx} = e^{\\cos(x)} \\cdot (-\\sin x) = \\boxed{-\\sin(x)\\, e^{\\cos(x)}}$."}]}
```
