---
id: continuity-differentiability-jee.worked-example-assured
concept_id: continuity-differentiability-jee
atom_type: worked_example
bloom_level: 3
difficulty: 0.4
exam_ids: ["*"]
scaffold_fade: true
variant_of: continuity-differentiability-jee.worked-example
for_stance: assured
---

**Problem.** Differentiate $y=\sin^{-1}\!\left(\dfrac{2x}{1+x^2}\right)$.

---

Substitute $x=\tan\theta$: the argument is $\sin 2\theta$. For $-1<x<1$, $2\theta\in\left(-\frac\pi2,\frac\pi2\right)$, so $y=2\theta=2\tan^{-1}x$ and

$$
\boxed{\frac{dy}{dx}=\frac{2}{1+x^2},\quad -1<x<1}
$$

**The distinction that costs marks.** The clean closed form above is not the answer for every $x$ — it is the answer only inside the domain where $\sin^{-1}(\sin 2\theta)=2\theta$ holds without adjustment. Past $|x|=1$, $2\theta$ leaves $\left(-\frac\pi2,\frac\pi2\right)$, and $y=\pi-2\tan^{-1}x$ instead, flipping the derivative's sign to $-\dfrac{2}{1+x^2}$. Two full marks are lost, on a correctly-executed substitution, purely from treating "the formula I derived" as if it were domain-free. Every inverse-trig substitution problem built on a double- or half-angle identity carries this same restriction implicitly — check the range of the intermediate angle before trusting the simplified form past it.

```interactive-spec
{"v": 1, "kind": "guided_walkthrough", "title": "Walk through: differentiate y = sin^-1(2x/(1+x^2)) for |x| < 1", "steps": [{"prompt": "The expression inside sin^-1 looks like a double-angle identity. If x = tan(theta), what does 2x/(1+x^2) become?", "hint": "Recall sin(2theta) = 2tan(theta)/(1+tan^2(theta)).", "answer": "2x/(1+x^2) = sin(2theta), so y = sin^-1(sin(2theta))."}, {"prompt": "For |x| < 1, theta = tan^-1(x) lies in (-pi/4, pi/4), so 2theta lies in (-pi/2, pi/2). What does y simplify to?", "hint": "sin^-1(sin(u)) = u exactly when u lies in [-pi/2, pi/2].", "answer": "y = 2theta = 2 tan^-1(x), valid for |x| < 1."}, {"prompt": "Differentiate y = 2 tan^-1(x) with respect to x. What is dy/dx?", "hint": "d/dx[tan^-1(x)] = 1/(1+x^2).", "answer": "dy/dx = 2/(1+x^2), valid only for |x| < 1."}, {"prompt": "What changes for |x| > 1, and why does it matter on JEE?", "hint": "For |x| > 1, theta = tan^-1(x) still lies in (-pi/2, pi/2), but 2theta now lies outside (-pi/2, pi/2), so sin^-1(sin(2theta)) is no longer just 2theta.", "answer": "For x > 1, y = pi - 2 tan^-1(x), so dy/dx = -2/(1+x^2) -- the sign flips. Using +2/(1+x^2) everywhere, regardless of domain, is a standard JEE trap."}]}
```
