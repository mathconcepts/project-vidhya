---
id: continuous-distributions.formal-definition
concept_id: continuous-distributions
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

**PDF:** $f(x)\ge0$, $\int_{-\infty}^{\infty}f(x)\,dx=1$; $P(a\le X\le b)=\int_a^b f(x)\,dx$.

**Normal:** $f(x)=\dfrac{1}{\sigma\sqrt{2\pi}}e^{-(x-\mu)^2/2\sigma^2}$; standardize via $Z=(X-\mu)/\sigma \sim N(0,1)$.

**Exponential:** $f(x)=\lambda e^{-\lambda x}$, $x\ge0$; $P(X>t)=e^{-\lambda t}$; memoryless: $P(X>s+t\mid X>s)=P(X>t)$.

**Uniform** on $[a,b]$: $f(x)=1/(b-a)$.

**Gamma** (shape $k$, rate $\lambda$): waiting time for the $k$-th event of a Poisson process; reduces to Exponential at $k=1$.

Use the Exponential's memoryless property only for waiting/interarrival times tied to a genuine Poisson process; don't apply it to Normal or Uniform variables, which do carry history — an easy trap when a problem's phrasing ("has already lasted…") sounds like it invites the shortcut regardless of which distribution actually governs it.
