---
id: definite-integration.hook
concept_id: definite-integration
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
---

A mock test gives you $\displaystyle\int_0^{\pi/2} \frac{\sin^3x}{\sin^3x+\cos^3x}\,dx$. Direct integration of that fraction is essentially impossible in exam time — there is no substitution or partial-fraction move that untangles $\sin^3x$ and $\cos^3x$ sitting together like that. And yet the answer is $\pi/4$, found in about ten seconds, for ANY exponent in place of the $3$. The trick uses one property: replacing $x$ with $\left(\frac{\pi}{2}-x\right)$ inside a definite integral over $[0,\pi/2]$ leaves the integral's VALUE unchanged, even though it swaps $\sin$ and $\cos$ everywhere. Add the original integral to its own mirror image, and the impossible fraction cancels into $1$.
