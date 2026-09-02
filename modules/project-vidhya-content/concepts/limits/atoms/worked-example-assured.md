---
# Alternative body for limits.worked_example, served when the learner
# stance is `assured`. The fenced walkthrough is copied verbatim from the
# base atom so the widget cannot drift between variants.
id: limits.worked_example.assured
concept_id: limits
atom_type: worked_example
bloom_level: 3
difficulty: 0.2
exam_ids: ["*"]
scaffold_fade: true
variant_of: limits.worked_example
for_stance: assured
---

$\lim_{x\to0}\dfrac{1-\cos x}{x^2}$: $\frac00$ at $x=0$, no factor to cancel, so L'Hôpital is the right call over factoring.

The distinction worth the marks: L'Hôpital's rule doesn't finish in one pass just because you differentiated once. First pass gives $\dfrac{\sin x}{2x}$ — check the form again before reading off an answer: it's still $\frac00$ at $x=0$. A second pass gives $\dfrac{\cos x}{2}\to\dfrac12$. Skipping the re-check after the first pass is the trap this problem is built around, not the differentiation itself.

$$
\boxed{\lim_{x\to 0}\frac{1-\cos x}{x^2}=\frac12}
$$

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: lim (1 - cos x)/x^2 as x approaches 0","steps":[{"prompt":"Substitute x = 0 directly. What form do you get, and can you factor anything?","hint":"Compute the numerator and denominator separately at x = 0.","answer":"0/0, indeterminate — and there is no common factor between 1 - cos x and x^2 to cancel, so factoring will not work here."},{"prompt":"Apply L'Hopital once: differentiate numerator and denominator. What do you get, and is it resolved yet?","hint":"d/dx(1 - cos x) = sin x; d/dx(x^2) = 2x. Check the new form at x = 0.","answer":"sin(x)/(2x), which is STILL 0/0 at x = 0 — not resolved. A second application is needed."},{"prompt":"Apply L'Hopital again and evaluate at x = 0. What is the limit?","hint":"d/dx(sin x) = cos x; d/dx(2x) = 2.","answer":"cos(x)/2 to cos(0)/2 = \\boxed{1/2}."}]}
```
