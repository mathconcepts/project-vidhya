---
id: ode-second-order-nonhomo.common-traps
concept_id: ode-second-order-nonhomo
atom_type: common_traps
bloom_level: 3
difficulty: 0.4
exam_ids: ["*"]
tested_by_atom: ode-second-order-nonhomo.micro-exercise
---

**Trap 1 — Forgetting the resonance check.** For $y''-3y'+2y=e^x$, the roots are $1,2$ — and $f(x)=e^x$ matches root $r=1$. The naive trial $y_p=Ae^x$ substitutes to $(1-3+2)Ae^x=0\cdot Ae^x=0\neq e^x$: an equation that can never balance, no matter what $A$ is. The fix is $y_p=Axe^x$, which gives $A=-1$, so $y_p=-xe^x$ — always re-check the forcing term against the roots before trusting a plain trial.

**Trap 2 — Treating $y_p$ as a second family of constants.** $y_p$ has no arbitrary constant of its own to tune with the initial conditions — only $C_1,C_2$ inside $y_h$ do. Applying $y(0)=y_0$ to $y_p$ alone (instead of the full $y=y_h+y_p$) leaves the system under-determined.

**Trap 3 — Reusing the undetermined-coefficients trial for a non-polynomial-exponential-trig forcing term.** $f(x)=\tan x$ or $f(x)=e^x/x$ never close into a finite differentiable family, so no polynomial-style trial exists — variation of parameters is required instead, not a bigger guess.

**Trap 4 — Applying variation of parameters' formula with the wrong sign or an unnormalized leading coefficient.** The formula assumes the ODE is written as $y''+py'+qy=f(x)$ (leading coefficient $1$); skipping the division by $a$ first silently scales $f(x)$ into the Wronskian integrals.
