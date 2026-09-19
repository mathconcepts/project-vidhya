---
id: continuity-differentiability-jee.intuition-assured
concept_id: continuity-differentiability-jee
atom_type: intuition
bloom_level: 2
difficulty: 0.2
exam_ids: ["*"]
variant_of: continuity-differentiability-jee.intuition
for_stance: assured
---

Not every differentiability failure looks like a corner. $f(x)=x^{1/3}$ is continuous at $x=0$ and has no visible kink — the curve is perfectly smooth there — yet $f'(x)=\frac13x^{-2/3}\to\infty$ as $x\to0$, so the derivative does not exist: the tangent line has gone vertical. A student trained only to look for a "sharp corner" misses this entirely. Zooming in near a genuinely differentiable point always produces a single, finite-slope line; a vertical tangent and a two-sided corner both break that, for different reasons.

The chain rule's own marks-costing slip is where the derivative gets evaluated. For $y=f(g(x))$, $\frac{dy}{dx}=f'(g(x))\cdot g'(x)$ — the outer derivative is evaluated *at $g(x)$*, not at $x$. Getting $f'$ and $g'$ both correct and then plugging $x$ into $f'$ by habit produces a wrong, plausible-looking answer that no amount of re-checking the differentiation rules themselves will catch — only re-checking *what was substituted where* will.
