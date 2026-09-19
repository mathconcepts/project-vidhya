---
id: continuity-differentiability-jee.worked-example-shaken
concept_id: continuity-differentiability-jee
atom_type: worked_example
bloom_level: 3
difficulty: 0.4
exam_ids: ["*"]
scaffold_fade: true
variant_of: continuity-differentiability-jee.worked-example
for_stance: shaken
---

**Problem.** Differentiate $y=\sin^{-1}\!\left(\dfrac{2x}{1+x^2}\right)$ for $-1<x<1$.

---

**Step 1 — Name the pattern before touching a derivative rule.**

$\dfrac{2x}{1+x^2}$ matches $\sin 2\theta=\dfrac{2\tan\theta}{1+\tan^2\theta}$ with $\theta=\tan^{-1}x$. Write that down first.

---

**Step 2 — Substitute $x=\tan\theta$ and check the range.**

For $-1<x<1$: $\theta=\tan^{-1}x\in\left(-\dfrac{\pi}{4},\dfrac{\pi}{4}\right)$, so $2\theta\in\left(-\dfrac{\pi}{2},\dfrac{\pi}{2}\right)$. In that exact range, $\sin^{-1}(\sin u)=u$, so:

$$
y=\sin^{-1}(\sin 2\theta)=2\theta=2\tan^{-1}x
$$

---

**Step 3 — Differentiate this simpler form.**

$$
\frac{dy}{dx}=2\cdot\frac{1}{1+x^2}=\boxed{\frac{2}{1+x^2}}
$$

---

**Step 4 — Write down the domain restriction explicitly.**

This formula holds only for $-1<x<1$. For $x>1$, the correct answer is $-\dfrac{2}{1+x^2}$ instead — the sign flips because $2\theta$ has left $\left(-\dfrac{\pi}{2},\dfrac{\pi}{2}\right)$.

**Check it yourself.** At $x=0.5$: $\dfrac{2(0.5)}{1+0.25}=\dfrac{1}{1.25}=0.8$, so $y=\sin^{-1}(0.8)\approx0.9273$. Compute $2\tan^{-1}(0.5)$ separately: also $\approx0.9273$. They match.

```interactive-spec
{"v": 1, "kind": "guided_walkthrough", "title": "Walk through: differentiate y = sin^-1(2x/(1+x^2)) for |x| < 1", "steps": [{"prompt": "The expression inside sin^-1 looks like a double-angle identity. If x = tan(theta), what does 2x/(1+x^2) become?", "hint": "Recall sin(2theta) = 2tan(theta)/(1+tan^2(theta)).", "answer": "2x/(1+x^2) = sin(2theta), so y = sin^-1(sin(2theta))."}, {"prompt": "For |x| < 1, theta = tan^-1(x) lies in (-pi/4, pi/4), so 2theta lies in (-pi/2, pi/2). What does y simplify to?", "hint": "sin^-1(sin(u)) = u exactly when u lies in [-pi/2, pi/2].", "answer": "y = 2theta = 2 tan^-1(x), valid for |x| < 1."}, {"prompt": "Differentiate y = 2 tan^-1(x) with respect to x. What is dy/dx?", "hint": "d/dx[tan^-1(x)] = 1/(1+x^2).", "answer": "dy/dx = 2/(1+x^2), valid only for |x| < 1."}, {"prompt": "What changes for |x| > 1, and why does it matter on JEE?", "hint": "For |x| > 1, theta = tan^-1(x) still lies in (-pi/2, pi/2), but 2theta now lies outside (-pi/2, pi/2), so sin^-1(sin(2theta)) is no longer just 2theta.", "answer": "For x > 1, y = pi - 2 tan^-1(x), so dy/dx = -2/(1+x^2) -- the sign flips. Using +2/(1+x^2) everywhere, regardless of domain, is a standard JEE trap."}]}
```
