---
# Alternative body for stokes-theorem.intuition, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: stokes-theorem.intuition.shaken
concept_id: stokes-theorem
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: stokes-theorem-intuition
for_stance: shaken
---

Take $\mathbf F=(-y,x,0)$ and let $C$ be the unit circle $x^2+y^2=1$ in the plane $z=0$, traversed counterclockwise, with $S$ the flat disk it bounds.

Along $C$, set $x=\cos\theta$ and $y=\sin\theta$. Then $\mathbf F=(-\sin\theta,\cos\theta,0)$ and $d\mathbf r=(-\sin\theta,\cos\theta,0)\,d\theta$, giving $\mathbf F\cdot d\mathbf r=\sin^2\theta+\cos^2\theta=1$ everywhere on the loop, so $\oint_C\mathbf F\cdot d\mathbf r=\int_0^{2\pi}1\,d\theta=2\pi$.

Over the disk, $\nabla\times\mathbf F=(0,0,2)$ is constant, and the upward normal $\hat n=\hat k$ matches the counterclockwise direction of $C$ by the right-hand rule, so $\iint_S(\nabla\times\mathbf F)\cdot d\mathbf S=\iint_D2\,dA=2\pi(1)^2=2\pi$.

Both routes give $2\pi$: one added the field's push along the rim, the other summed the spin trapped inside it, and Stokes' theorem guarantees these always match, provided the traversal direction and the surface normal stay linked by the right-hand rule.
