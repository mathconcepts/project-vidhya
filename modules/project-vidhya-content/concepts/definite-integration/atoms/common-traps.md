---
id: definite-integration.common_traps
concept_id: definite-integration
atom_type: common_traps
bloom_level: 4
difficulty: 0.55
exam_ids: ["*"]
---

**Trap 1: Halving an integral without checking $f(x)=f(a-x)$ first**

The King's-Rule halving shortcut only fires when the integrand genuinely maps to itself under $x\to a-x$. For $\int_0^2(x+1)\,dx$: the true value is $\left[\frac{x^2}{2}+x\right]_0^2 = 2+2=4$. But $f(x)=x+1$ and $f(2-x)=3-x$ are NOT the same function, so treating the interval as "symmetric-looking" and computing $2\int_0^1(x+1)\,dx = 2\left(\frac{1}{2}+1\right)=3$ gives the wrong answer, $3$ instead of $4$. The interval's shape is irrelevant; only the function's behaviour under the reflection matters.

**Trap 2: Forgetting the sign flip when limits are reversed**

$\int_b^a f(x)\,dx=-\int_a^b f(x)\,dx$. For $\int_3^1 2x\,dx$: since $\int_1^3 2x\,dx=[x^2]_1^3=9-1=8$, the reversed-limit integral is $\int_3^1 2x\,dx=-8$, not $8$. Writing the upper limit as whichever number is bigger, out of habit, silently drops this sign.

**Trap 3: Assuming any symmetric-interval integral vanishes**

Only an ODD function integrates to $0$ over $[-a,a]$; an EVEN function does not — it doubles, it does not cancel. $\int_{-1}^1 x^2\,dx = \frac{2}{3}$, not $0$, because $x^2$ is even ($f(-x)=f(x)$), not odd. Confusing "the interval is symmetric" with "the integral must be zero" throws away a nonzero answer.

**Trap 4: Not splitting at a crossing point when finding area between curves**

When two curves cross INSIDE the interval of interest, "top minus bottom" flips sides at the crossing, and the interval must be split there. For the area between $y=x$ and $y=-x$ from $x=-1$ to $x=2$ (crossing at $x=0$): the correct, split calculation gives $\int_{-1}^0[(-x)-x]\,dx + \int_0^2[x-(-x)]\,dx = 1+4=5$. Computing it as one unsplit integral, $\int_{-1}^2[x-(-x)]\,dx=\int_{-1}^2 2x\,dx=4-1=3$, silently uses the wrong sign on the left piece and gives $3$ instead of the correct $5$.
