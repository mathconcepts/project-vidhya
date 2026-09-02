---
# Alternative body for complex-integration.intuition, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling.
id: complex-integration.intuition.shaken
concept_id: complex-integration
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
modality: visual
variant_of: complex-integration.intuition
for_stance: shaken
---

Take $f(z)=1/z$ on the circle $|z|=1$, counterclockwise. Parametrize $z=e^{it}$, $t\in[0,2\pi]$, $dz=ie^{it}dt$: $\oint_Cf(z)\,dz=\int_0^{2\pi}\frac{ie^{it}}{e^{it}}\,dt=\int_0^{2\pi}i\,dt=2\pi i$. The general formula for any curve is exactly this, $\oint_Cf(z)\,dz=\int_a^bf(z(t))z'(t)\,dt$, worked out here for one specific one.

Now the theorem behind it. If $f$ is analytic everywhere inside and on a simple closed contour $C$, then $\oint_Cf(z)\,dz=0$ — no exceptions to either condition. Our $1/z$ example got $2\pi i\neq0$ precisely because $1/z$ fails to be analytic at $z=0$, and $z=0$ sits inside $|z|=1$.

Cauchy's Integral Formula pushes further: if $f$ is analytic inside and on $C$, and $z_0$ is *strictly inside* $C$, then $f(z_0)=\frac{1}{2\pi i}\oint_C\frac{f(z)}{z-z_0}\,dz$; derivatives come the same way, $f^{(n)}(z_0)=\frac{n!}{2\pi i}\oint_C\frac{f(z)}{(z-z_0)^{n+1}}\,dz$.

Keep the ML bound in your pocket for a fast check: $\left|\oint_Cf(z)\,dz\right|\le ML$, $M=\max_{z\in C}|f(z)|$, $L$ the arc length of $C$.

Method: find every singularity of $f$, check which sit inside $C$; none inside means the integral is $0$ before any further work.
