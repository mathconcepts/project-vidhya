---
id: definite-integration.formal_definition
concept_id: definite-integration
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

**Definite integral as a limit of a sum**: $\displaystyle\int_a^b f(x)\,dx = \lim_{n\to\infty} h\sum_{r=0}^{n-1} f(a+rh)$, where $h=\dfrac{b-a}{n}$. The integral is the exact value that a Riemann sum (rectangles of width $h$) approaches as the number of strips grows without bound.

**Fundamental Theorem of Calculus (evaluation form)**: if $F'(x)=f(x)$ on $[a,b]$, then $\displaystyle\int_a^b f(x)\,dx = F(b)-F(a)$.

**Reversal of limits**: $\displaystyle\int_b^a f(x)\,dx = -\int_a^b f(x)\,dx$.

**Additivity over sub-intervals**: $\displaystyle\int_a^b f(x)\,dx = \int_a^c f(x)\,dx + \int_c^b f(x)\,dx$ for any $c$.

**King's Rule**: $\displaystyle\int_a^b f(x)\,dx = \int_a^b f(a+b-x)\,dx$. When $a=0$, this reads $\int_0^b f(x)\,dx=\int_0^b f(b-x)\,dx$.

**Symmetric-interval properties**: for $\displaystyle\int_{-a}^{a} f(x)\,dx$ — equals $2\int_0^a f(x)\,dx$ if $f$ is even ($f(-x)=f(x)$); equals $0$ if $f$ is odd ($f(-x)=-f(x)$). Neither shortcut applies to a function that is neither even nor odd.

**Periodicity**: if $f(x+T)=f(x)$ for all $x$, then $\displaystyle\int_0^{nT} f(x)\,dx = n\int_0^T f(x)\,dx$ for a positive integer $n$.

**Area between two curves**: for $f(x)\geq g(x)$ on $[a,b]$, the area enclosed is $\displaystyle\int_a^b [f(x)-g(x)]\,dx$. Where the curves cross inside $[a,b]$, the interval must be split at each crossing point and the top/bottom roles re-checked on each piece — the same subtraction applied blindly across a crossing gives a wrong total, not merely an imprecise one.
