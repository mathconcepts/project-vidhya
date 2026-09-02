---
id: ode-second-order-homo.intuition
concept_id: ode-second-order-homo
atom_type: intuition
bloom_level: 2
difficulty: 0.1
exam_ids: ["*"]
---

## One Guess Does All the Work

The equation $ay''+by'+cy=0$ never changes what a solution *looks like* — only the derivative of $e^{rx}$ is a multiple of itself, so trying $y=e^{rx}$ turns the whole ODE into one algebra problem: $ar^2+br+c=0$. Every solution comes from picking the right $r$ (or $r$'s) and combining them.

Take $y''-5y'+6y=0$. The characteristic equation is $r^2-5r+6=0$, which factors as $(r-2)(r-3)=0$ — roots $r=2,3$. Both $e^{2x}$ and $e^{3x}$ solve the ODE on their own, and because the equation is linear, so does any combination $C_1e^{2x}+C_2e^{3x}$. That combination — two free constants — is the *whole* general solution, no more roots to find.

What changes across problems is only how the quadratic's roots come out:

| Discriminant $b^2-4ac$ | Roots | Solution shape |
|---|---|---|
| Positive | Two distinct real $r_1,r_2$ | $C_1e^{r_1x}+C_2e^{r_2x}$ |
| Zero | One repeated real $r$ | $(C_1+C_2x)e^{rx}$ |
| Negative | Complex $\alpha\pm i\beta$ | $e^{\alpha x}(C_1\cos\beta x+C_2\sin\beta x)$ |

The repeated-root row is the one case where a second, *independent* solution isn't another exponential — it's $xe^{rx}$, needed only because $e^{rx}$ alone can't supply two degrees of freedom by itself.
