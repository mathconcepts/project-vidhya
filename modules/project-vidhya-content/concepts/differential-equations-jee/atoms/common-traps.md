---
id: differential-equations-jee.common_traps
concept_id: differential-equations-jee
atom_type: common_traps
bloom_level: 4
difficulty: 0.55
exam_ids: ["*"]
---

**Trap 1: Reading off the degree before clearing a fractional power**

Degree is only defined once the equation is a polynomial in its derivatives — a radical or fractional power on any derivative must be cleared FIRST. For $y'+(y'')^{1/3}=x$: isolate the radical, $(y'')^{1/3}=x-y'$, then cube both sides, $y''=(x-y')^3$. Only now is degree readable: order $2$ (from $y''$), degree $1$ (since $y''$ appears to the first power once the equation is polynomial). Reading "degree $1/3$" straight off the unmodified equation is not a valid degree at all.

**Trap 2: Calling an equation homogeneous because it "has $x$ and $y$ mixed together"**

The actual test is $f(\lambda x,\lambda y)=f(x,y)$ for every $\lambda$ — every term must scale by the SAME power of $\lambda$. $\dfrac{dy}{dx}=\dfrac{x+y}{x-y}$ passes: both $x$ and $y$ scale as $\lambda^1$ throughout. $\dfrac{dy}{dx}=\dfrac{x^2+y}{x-y}$ fails: $x^2$ scales as $\lambda^2$ while $y$ scales as $\lambda^1$, so no common factor of $\lambda$ cancels, and the substitution $y=vx$ does not reduce it to a separable equation in $v$ and $x$.

**Trap 3: Reading $P(x)$ off a linear equation before dividing through**

The integrating-factor formula needs the EXACT standard form $\dfrac{dy}{dx}+P(x)y=Q(x)$ — coefficient of $\dfrac{dy}{dx}$ must be $1$. For $2\dfrac{dy}{dx}+4y=e^{-x}$: dividing through by $2$ first gives $\dfrac{dy}{dx}+2y=\dfrac{1}{2}e^{-x}$, so $P(x)=2$, not $4$. Reading $P=4$ directly off the unadjusted equation puts the wrong exponent into every integrating factor computed from it.

**Trap 4: Stopping after one differentiation when the family has two constants**

A family with $n$ independent arbitrary constants needs $n$ differentiations to eliminate all of them. $y=A\cos x+B\sin x$ has two constants, $A$ and $B$, so it needs TWO differentiations: $y'=-A\sin x+B\cos x$, $y''=-A\cos x-B\sin x=-y$, giving the order-$2$ equation $y''+y=0$. Stopping after the first differentiation leaves $A$ and $B$ still present in the relation — not yet a differential equation of the family, only an intermediate step.
