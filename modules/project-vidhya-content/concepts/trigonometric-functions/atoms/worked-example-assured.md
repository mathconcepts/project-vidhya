---
id: trigonometric-functions.worked-example-assured
concept_id: trigonometric-functions
atom_type: worked_example
bloom_level: 3
difficulty: 0.4
exam_ids: ["*"]
variant_of: trigonometric-functions.worked-example
for_stance: assured
---

**$2\sin^2\theta-\sin\theta-1=0$** factors to $(2s+1)(s-1)=0$ with $s=\sin\theta$, giving $\sin\theta=-1/2$ or $\sin\theta=1$. The general-solution shape you reach for depends entirely on WHICH value you're solving for — treating both cases with the same formula is where marks are lost.

$\sin\theta=1$ is a boundary value, not a generic one: it is hit at a single point per period, so the general $\theta=n\pi+(-1)^n\alpha$ shape technically still works with $\alpha=\pi/2$, but simplifies — try $n=0$: $\theta=\pi/2$; try $n=1$: $\theta=\pi-\pi/2=\pi/2$ again, the SAME angle, because $\sin(\pi/2)$ has no distinct mirror image. The formula collapses to $\theta=2n\pi+\pi/2$, one family, not two.

$\sin\theta=-1/2$ is a generic value with a genuine mirror pair ($210°$ and $330°$ in $[0°,360°)$), so it needs the full alternating form: $\theta=n\pi+(-1)^{n+1}\pi/6$. Reusing the collapsed boundary-case formula here — $\theta=2n\pi-\pi/6$ — would silently drop the second family entirely (it never produces $210°$). Knowing sine's maximum is a single point, not a mirrored pair, is the condition that decides which formula shape is even legal to write down.
