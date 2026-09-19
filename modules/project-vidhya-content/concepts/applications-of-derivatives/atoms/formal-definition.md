---
id: applications-of-derivatives.formal-definition
concept_id: applications-of-derivatives
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

**Rate of change**: for $y=f(x)$, the instantaneous rate of change of $y$ with respect to $x$ at $x=a$ is $f'(a)$. The average rate of change over $[a,b]$ is $\dfrac{f(b)-f(a)}{b-a}$.

**Tangent line** at $(x_0,f(x_0))$: $y-f(x_0)=f'(x_0)(x-x_0)$.

**Normal line** at $(x_0,f(x_0))$: $y-f(x_0)=-\dfrac{1}{f'(x_0)}(x-x_0)$, provided $f'(x_0)\neq0$. If $f'(x_0)=0$, the tangent is horizontal ($y=f(x_0)$) and the normal is the vertical line $x=x_0$.

**Monotonicity**: $f$ is (strictly) increasing on an interval where $f'(x)>0$ throughout, and (strictly) decreasing where $f'(x)<0$ throughout.

**Local maximum / minimum (first derivative test)**: $x=c$ is a local maximum if $f'(c)=0$ and $f'$ changes sign from positive to negative at $c$; a local minimum if $f'(c)=0$ and $f'$ changes from negative to positive. A critical point where $f'$ does not change sign is neither.

**Second derivative test**: at a critical point $c$ with $f'(c)=0$ — if $f''(c)<0$, $c$ is a local maximum; if $f''(c)>0$, $c$ is a local minimum; if $f''(c)=0$, the test is inconclusive and the first derivative test must be used instead.

**Rolle's Theorem**: if $f$ is continuous on $[a,b]$, differentiable on $(a,b)$, and $f(a)=f(b)$, then there exists $c\in(a,b)$ with $f'(c)=0$.

**Lagrange's Mean Value Theorem (LMVT)**: if $f$ is continuous on $[a,b]$ and differentiable on $(a,b)$, then there exists $c\in(a,b)$ with $\displaystyle f'(c)=\frac{f(b)-f(a)}{b-a}$. Rolle's Theorem is the special case where $f(a)=f(b)$, making the right-hand side zero.
