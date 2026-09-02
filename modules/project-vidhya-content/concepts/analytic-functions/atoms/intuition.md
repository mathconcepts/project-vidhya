---
id: analytic-functions.intuition
concept_id: analytic-functions
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
modality: visual
---

A function $f(z) = u(x,y) + iv(x,y)$ is **analytic** (holomorphic) at a point if it is complex-differentiable in a whole neighbourhood of that point — not just at the point itself. Complex differentiability turns out far stronger than real differentiability: it forces the **Cauchy-Riemann equations**,

$$u_x = v_y \qquad u_y = -v_x$$

to hold, with continuous partials, throughout that neighbourhood.

A function analytic **everywhere** in $\mathbb{C}$ is called **entire** — $e^z$, $\sin z$, $\cos z$, and every polynomial qualify. A point where $f$ fails to be analytic is a **singularity**: $1/z$ has one at $z=0$; $|z|^2$ is analytic *nowhere* at all, since CR fails at every point except the single origin.

If $f=u+iv$ is analytic, both $u$ and $v$ satisfy Laplace's equation $\nabla^2u=0$ — they are **harmonic**, and **harmonic conjugates** of each other. That link is why analytic functions show up in electrostatics and fluid flow: solve one harmonic problem and its conjugate comes along for free.

The working method: write $u,v$ as functions of $x,y$, compute all four partials, check both CR equations. Hold everywhere with continuity — entire. Hold only on a curve or isolated points — not analytic there at all.
