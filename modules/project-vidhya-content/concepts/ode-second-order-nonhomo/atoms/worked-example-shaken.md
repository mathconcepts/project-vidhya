---
# for_stance: shaken — same problem, terse steps, full arithmetic shown, explicit check.
id: ode-second-order-nonhomo.worked-example.shaken
concept_id: ode-second-order-nonhomo
atom_type: worked_example
bloom_level: 3
difficulty: 0.2
exam_ids: ["*"]
scaffold_fade: true
variant_of: ode-second-order-nonhomo.worked-example
for_stance: shaken
---

$y''-3y'+2y=e^{3x}$, $y(0)=0$, $y'(0)=0$.

Characteristic equation: $r^2-3r+2=0=(r-1)(r-2)$, roots $1,2$. $y_h=C_1e^x+C_2e^{2x}$.

Check resonance: is $3$ a root? No. Trial $y_p=Ae^{3x}$ is safe.

$y_p'=3Ae^{3x}$, $y_p''=9Ae^{3x}$. Substitute: $(9-9+2)Ae^{3x}=2Ae^{3x}=e^{3x}$, so $A=\tfrac12$.

$$y=C_1e^x+C_2e^{2x}+\tfrac12e^{3x}$$

Apply $y(0)=0$: $C_1+C_2=-\tfrac12$.

Apply $y'(0)=0$: $y'=C_1e^x+2C_2e^{2x}+\tfrac32e^{3x}$, so $C_1+2C_2=-\tfrac32$.

Subtract: $C_2=-1$, $C_1=\tfrac12$.

$$\boxed{y(x)=\tfrac12e^{x}-e^{2x}+\tfrac12e^{3x}}$$

Check: $y(0)=\tfrac12-1+\tfrac12=0$. $y'(0)=\tfrac12-2+\tfrac32=0$. Both conditions hold.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: solving y'' - 3y' + 2y = e^3x by undetermined coefficients","steps":[{"prompt":"Find the homogeneous solution of $y''-3y'+2y=0$.","hint":"Solve $r^2-3r+2=0$ by factoring.","answer":"$r=1,2$, so $y_h=C_1e^x+C_2e^{2x}$."},{"prompt":"Is $y_p=Ae^{3x}$ a safe trial for the forcing term $e^{3x}$? Why?","hint":"Compare $3$ against the roots found above.","answer":"Yes — $3$ is not a root ($1,2$ are), so no resonance and no $x$-multiplier is needed."},{"prompt":"Solve for $A$ and then apply $y(0)=0,\\\\;y'(0)=0$ to find the full particular solution.","hint":"Substitute the trial into the ODE first to get $A=1/2$, then solve the linear system for $C_1,C_2$.","answer":"$A=1/2$; $C_1=1/2,\\\\;C_2=-1$, giving $y=\\\\tfrac12e^x-e^{2x}+\\\\tfrac12e^{3x}$."}]}
```
