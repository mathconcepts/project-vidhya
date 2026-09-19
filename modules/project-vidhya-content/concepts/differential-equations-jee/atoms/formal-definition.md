---
id: differential-equations-jee.formal_definition
concept_id: differential-equations-jee
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

**Order**: the order of the highest derivative appearing in the equation.

**Degree**: the power of the highest-order derivative, once the equation is written as a polynomial in all its derivatives — free of radicals and fractional powers of any derivative. An equation must be cleared of such radicals/fractions BEFORE its degree can be read off; a fractional power on the highest derivative means the degree is not yet visible.

**General solution**: a solution containing exactly as many independent arbitrary constants as the order of the equation. A **particular solution** fixes every constant to a specific value, typically using given initial or boundary conditions.

**Formation of a differential equation**: given a family of curves with $n$ independent arbitrary constants, differentiating $n$ times and eliminating all $n$ constants algebraically produces a differential equation of order $n$ — one equation shared by the entire family.

**Variable separable**: an equation reducible to the form $g(y)\,dy = h(x)\,dx$, solved by integrating both sides independently.

**Homogeneous equation**: an equation of the form $\dfrac{dy}{dx}=f\!\left(\dfrac{y}{x}\right)$ (equivalently: $f(\lambda x,\lambda y)=f(x,y)$ for every $\lambda$, i.e. $f$ has degree $0$). Solved by the substitution $y=vx$, which reduces it to a variable-separable equation in $v$ and $x$.

**Linear first-order equation**: standard form $\dfrac{dy}{dx}+P(x)y=Q(x)$. The **integrating factor** is $\mathrm{IF}=e^{\int P(x)\,dx}$; multiplying through by it collapses the left side to $\dfrac{d}{dx}\big(y\cdot \mathrm{IF}\big)$ by the product rule run backwards, giving the general solution $y\cdot \mathrm{IF} = \int Q(x)\cdot \mathrm{IF}\,dx + C$.

**Method selector**: check separability first — can the equation be rearranged into $g(y)\,dy=h(x)\,dx$? If not, check whether the right side is a function of $y/x$ alone (homogeneous); substitute $y=vx$ if so. If neither applies but the equation is linear in $y$ and its derivative, use the integrating factor. Forcing separation onto an equation that is genuinely linear (mixing $x$ and $y$ additively rather than as a ratio) is a dead end, not merely slower.
