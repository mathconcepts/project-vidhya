---
id: indefinite-integration.common_traps
concept_id: indefinite-integration
atom_type: common_traps
bloom_level: 4
difficulty: 0.55
exam_ids: ["*"]
---

**Trap 1: Running partial fractions on an improper rational function**

A rational function is "improper" when the top's degree is $\geq$ the bottom's degree — partial fractions only decomposes a PROPER fraction, so skipping the division step first gives you an equation with no solution. For $\int \dfrac{x^3}{x^2+1}\,dx$: divide first, $\dfrac{x^3}{x^2+1} = x - \dfrac{x}{x^2+1}$ (long division, quotient $x$, remainder $-x$). Now integrate each piece: $\dfrac{x^2}{2} - \dfrac{1}{2}\ln(x^2+1) + C$. Trying to decompose $x^3/(x^2+1)$ directly, without dividing, has no valid partial-fraction form at all.

**Trap 2: Using only one term per power for a repeated linear factor**

A factor $(x-a)^2$ in the denominator needs TWO terms, $\dfrac{A}{x-a}+\dfrac{B}{(x-a)^2}$ — one for every power from $1$ up to $2$ — not a single $\dfrac{A}{(x-a)^2}$. For $\int \dfrac{x+1}{(x-1)^2}\,dx$: setting $x+1=A(x-1)+B$ gives $A=1,B=2$, so the integral is $\ln|x-1| - \dfrac{2}{x-1} + C$. Leaving out the $A/(x-1)$ term drops the log entirely and gives a wrong answer.

**Trap 3: Losing a sign midway through cyclic integration by parts**

$\int e^x\sin x\,dx$ requires by parts TWICE, and the integral you started with reappears on the right — collect it algebraically instead of integrating a third time. Working it through carefully: $\int e^x\sin x\,dx = \dfrac{e^x(\sin x-\cos x)}{2}+C$. A sign flip in either application of by parts (there are two minus signs to track) silently swaps this to $\dfrac{e^x(\cos x-\sin x)}{2}$ instead — differentiate your final answer to catch this before submitting.

**Trap 4: Forgetting the $1/(\text{coefficient})$ factor in a linear substitution**

For $\int \dfrac{1}{3-2x}\,dx$, the tempting shortcut is $\ln|3-2x|+C$ directly — but $u=3-2x$ gives $du=-2\,dx$, so $dx=-\dfrac{1}{2}du$, and the correct answer is $-\dfrac{1}{2}\ln|3-2x|+C$. Differentiate the shortcut answer to check: $\dfrac{d}{dx}\ln|3-2x| = \dfrac{-2}{3-2x}$, which is DOUBLE the actual integrand — the missing $-1/2$ is never optional when the inner function's own derivative is not $1$.
