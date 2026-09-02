---
# for_stance: assured — the one distinction that costs marks: y_p itself is never unique; only the full y = y_h + y_p after fitting constants is.
id: ode-second-order-nonhomo.worked-example.assured
concept_id: ode-second-order-nonhomo
atom_type: worked_example
bloom_level: 3
difficulty: 0.2
exam_ids: ["*"]
scaffold_fade: true
variant_of: ode-second-order-nonhomo.worked-example
for_stance: assured
---

$y_p$ itself is never unique — add any homogeneous solution to it and it still solves the same forcing equation, since $y_h$ contributes zero to the left side. What IS pinned down uniquely is the full solution after folding the initial conditions into $y=y_h+y_p$: for $y''-3y'+2y=e^{3x}$ with $y(0)=y'(0)=0$, that unique answer is

$$\boxed{y(x)=\tfrac12e^{x}-e^{2x}+\tfrac12e^{3x}}$$

regardless of which valid $y_p$ you started from. A tempting-but-wrong worry is comparing your $y_p=\tfrac12e^{3x}$ against a solutions manual's $y_p=\tfrac12e^{3x}+e^{x}$ and assuming one of you is wrong — they aren't in conflict; the second just absorbed part of $y_h$ early, and both reach the identical final $y(x)$ once the constants are fit to $y(0),y'(0)$.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: solving y'' - 3y' + 2y = e^3x by undetermined coefficients","steps":[{"prompt":"Find the homogeneous solution of $y''-3y'+2y=0$.","hint":"Solve $r^2-3r+2=0$ by factoring.","answer":"$r=1,2$, so $y_h=C_1e^x+C_2e^{2x}$."},{"prompt":"Is $y_p=Ae^{3x}$ a safe trial for the forcing term $e^{3x}$? Why?","hint":"Compare $3$ against the roots found above.","answer":"Yes — $3$ is not a root ($1,2$ are), so no resonance and no $x$-multiplier is needed."},{"prompt":"Solve for $A$ and then apply $y(0)=0,\\\\;y'(0)=0$ to find the full particular solution.","hint":"Substitute the trial into the ODE first to get $A=1/2$, then solve the linear system for $C_1,C_2$.","answer":"$A=1/2$; $C_1=1/2,\\\\;C_2=-1$, giving $y=\\\\tfrac12e^x-e^{2x}+\\\\tfrac12e^{3x}$."}]}
```
