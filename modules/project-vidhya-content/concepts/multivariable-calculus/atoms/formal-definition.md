---
id: multivariable-calculus.formal_definition
concept_id: multivariable-calculus
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

**Partial derivative.**
$$
\frac{\partial f}{\partial x}(a,b)=\lim_{h\to0}\frac{f(a+h,b)-f(a,b)}{h},
$$
holding $y=b$ fixed (symmetrically for $\partial f/\partial y$).

**Multivariable chain rule (total derivative).** If $z=f(x,y)$ with $x=x(t)$, $y=y(t)$,
$$
\frac{dz}{dt}=\frac{\partial z}{\partial x}\frac{dx}{dt}+\frac{\partial z}{\partial y}\frac{dy}{dt}.
$$

**Jacobian.** For $\mathbf F=(f_1,f_2)$, the linearization matrix is
$$
J=\begin{pmatrix}\partial f_1/\partial x & \partial f_1/\partial y\\ \partial f_2/\partial x & \partial f_2/\partial y\end{pmatrix}.
$$

Use the multivariable chain rule whenever BOTH $x$ and $y$ vary through a shared parameter $t$; use a plain partial derivative when only one variable is asked to move, the other explicitly held at a stated value. The tempting-but-wrong move is computing only $\partial z/\partial x\cdot dx/dt$ and dropping the $y$-term whenever $y$ also depends on $t$ — this silently reduces a genuinely two-variable rate of change to a one-variable one, understating it whenever the dropped term is nonzero.
