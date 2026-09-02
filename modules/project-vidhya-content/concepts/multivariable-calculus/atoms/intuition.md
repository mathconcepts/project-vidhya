---
id: multivariable-calculus.intuition
concept_id: multivariable-calculus
atom_type: intuition
bloom_level: 2
difficulty: 0.2
exam_ids: ["*"]
---

Treat $z=f(x,y)$ as the height of a landscape over the $(x,y)$ ground plane. Cutting a vertical slice through that landscape along a fixed value of $y$ turns the surface back into an ordinary single-variable curve — and the slope of THAT curve is $\partial f/\partial x$. Cut along a fixed $x$ instead and you get $\partial f/\partial y$. Every partial derivative is secretly an ordinary derivative, just applied after freezing every other input.

The gradient $\nabla f=\left(\dfrac{\partial f}{\partial x},\dfrac{\partial f}{\partial y}\right)$ bundles both slices into one vector, pointing in the direction the landscape climbs fastest at that exact point.

When BOTH $x$ and $y$ move together along a path $\big(x(t),y(t)\big)$, tracking the total rate of change needs both slopes at once — that is the multivariable chain rule, $\dfrac{dz}{dt}=\dfrac{\partial z}{\partial x}\dfrac{dx}{dt}+\dfrac{\partial z}{\partial y}\dfrac{dy}{dt}$ — and dropping either term silently assumes the other variable never moved.
