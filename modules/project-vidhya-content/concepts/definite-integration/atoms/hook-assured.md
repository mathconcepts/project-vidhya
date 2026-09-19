---
id: definite-integration.hook.assured
concept_id: definite-integration
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: definite-integration.hook
for_stance: assured
---

$\displaystyle\int_0^{\pi/2}\frac{\sin^3x}{\sin^3x+\cos^3x}\,dx=\frac{\pi}{4}$ for any exponent in place of $3$, and the exponent never matters — that is the tell that a property, not a technique, is doing the work. King's Rule, $\int_0^a f(x)\,dx=\int_0^a f(a-x)\,dx$, turns $f(x)=\dfrac{\sin^kx}{\sin^kx+\cos^kx}$ into its own complement under $x\to\frac{\pi}{2}-x$: adding $f(x)+f(\frac\pi2-x)$ always gives exactly $1$, regardless of $k$. The habit worth building: before attempting any direct method on a definite integral over a "nice" interval like $[0,\pi/2]$ or $[0,a]$, check whether $f(x)+f(a-x)$ collapses to something constant — when it does, the integral is solved without ever finding an antiderivative.
