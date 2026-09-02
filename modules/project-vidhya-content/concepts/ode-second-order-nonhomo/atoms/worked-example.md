---
id: ode-second-order-nonhomo.worked-example
concept_id: ode-second-order-nonhomo
atom_type: worked_example
bloom_level: 3
difficulty: 0.2
exam_ids: ["*"]
scaffold_fade: true
---

## Solve $y''-3y'+2y=e^{3x}$, $\;y(0)=0,\;y'(0)=0$

---

**Step 1 — Method selector.** Before guessing $y_p=Ae^{3x}$, check whether $3$ is a root of the characteristic equation $r^2-3r+2=(r-1)(r-2)=0$ — it isn't (roots are $1,2$), so the plain exponential trial is safe to use as-is. A tempting-but-wrong move is skipping this check out of habit: had the forcing term been $e^{x}$ or $e^{2x}$ instead, the same plain trial would substitute to $0=e^x$ — an impossible equation — unless multiplied by $x$ first.

---

**Step 2 — Homogeneous solution.** $r^2-3r+2=0\Rightarrow(r-1)(r-2)=0\Rightarrow r=1,2$.
$$y_h=C_1e^{x}+C_2e^{2x}$$

---

**Step 3 — Particular solution.** Trial $y_p=Ae^{3x}$: $y_p'=3Ae^{3x}$, $y_p''=9Ae^{3x}$.
$$9Ae^{3x}-3(3Ae^{3x})+2Ae^{3x}=(9-9+2)Ae^{3x}=2Ae^{3x}$$
Set equal to $e^{3x}$: $2A=1\Rightarrow A=\tfrac12$, so $y_p=\tfrac12e^{3x}$.

---

**Step 4 — General solution.**
$$y=C_1e^{x}+C_2e^{2x}+\tfrac12e^{3x}$$

---

**Step 5 — Apply $y(0)=0$.**
$$C_1+C_2+\tfrac12=0\;\Longrightarrow\;C_1+C_2=-\tfrac12$$

---

**Step 6 — Apply $y'(0)=0$.** $y'=C_1e^x+2C_2e^{2x}+\tfrac32e^{3x}$.
$$C_1+2C_2+\tfrac32=0\;\Longrightarrow\;C_1+2C_2=-\tfrac32$$

---

**Step 7 — Solve the pair.** Subtracting: $C_2=-\tfrac32-(-\tfrac12)=-1$, then $C_1=-\tfrac12-(-1)=\tfrac12$.

$$\boxed{y(x)=\tfrac12e^{x}-e^{2x}+\tfrac12e^{3x}}$$

---

**Step 8 — Check.** $y(0)=\tfrac12-1+\tfrac12=0$ ✓. $y'(0)=\tfrac12-2+\tfrac32=0$ ✓. Both conditions hold.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: solving y'' - 3y' + 2y = e^3x by undetermined coefficients","steps":[{"prompt":"Find the homogeneous solution of $y''-3y'+2y=0$.","hint":"Solve $r^2-3r+2=0$ by factoring.","answer":"$r=1,2$, so $y_h=C_1e^x+C_2e^{2x}$."},{"prompt":"Is $y_p=Ae^{3x}$ a safe trial for the forcing term $e^{3x}$? Why?","hint":"Compare $3$ against the roots found above.","answer":"Yes — $3$ is not a root ($1,2$ are), so no resonance and no $x$-multiplier is needed."},{"prompt":"Solve for $A$ and then apply $y(0)=0,\\\\;y'(0)=0$ to find the full particular solution.","hint":"Substitute the trial into the ODE first to get $A=1/2$, then solve the linear system for $C_1,C_2$.","answer":"$A=1/2$; $C_1=1/2,\\\\;C_2=-1$, giving $y=\\\\tfrac12e^x-e^{2x}+\\\\tfrac12e^{3x}$."}]}
```
