---
id: numerical-ode.worked-example
concept_id: numerical-ode
atom_type: worked_example
bloom_level: 3
difficulty: 0.2
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** Solve $\frac{dy}{dt}=-2y$, $y(0)=1$, using Euler's method with $h=0.1$ over $[0,0.2]$; compare against the exact solution.

---

**Step 1 — First Euler step.** $f(t,y)=-2y$. $y_1=y_0+h\,f(t_0,y_0)=1+0.1(-2)(1)=0.8$.

---

**Step 2 — Second Euler step.** $y_2=y_1+h\,f(t_1,y_1)=0.8+0.1(-2)(0.8)=0.64$.

$$\boxed{y(0.2)\approx0.64\ \text{(Euler)}}$$

---

**Step 3 — Exact solution.** Separating variables: $\frac{dy}{y}=-2\,dt\Rightarrow y(t)=Ae^{-2t}$; $y(0)=1\Rightarrow A=1$. So $y(t)=e^{-2t}$, and

$$y(0.2)=e^{-0.4}\approx0.6703$$

---

**Step 4 — Error.** $E_a=|0.6703-0.64|\approx0.0303$, $E_p=\frac{0.0303}{0.6703}\times100\%\approx4.52\%$.

**Verification:** halving $h$ to $0.05$ (four steps) should roughly halve this error, since Euler is first-order — that scaling check is a fast way to confirm the arithmetic rather than a full recomputation.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Euler's method for exponential decay","steps":[{"prompt":"At t=0, y=1. What is the slope f(0,1) = -2(1)?","hint":"The slope tells us how fast y is changing at this point.","answer":"f(0,1) = -2"},{"prompt":"Take one Euler step. Compute y1 = y0 + h·f(t0,y0) = 1 + 0.1×(-2).","hint":"Multiply the step size h=0.1 by the slope, then add to the current value.","answer":"y1 = 0.8"},{"prompt":"At t1=0.1, the new slope is f(0.1, 0.8) = -2(0.8). What is it?","hint":"The slope changes because y has changed.","answer":"f(0.1, 0.8) = -1.6"},{"prompt":"Take the second Euler step. Compute y2 = 0.8 + 0.1×(-1.6).","hint":"Apply the same formula with the new slope.","answer":"y2 = 0.64"},{"prompt":"Solve the ODE exactly: y(t) = e^{-2t}. What is y(0.2)?","hint":"Evaluate the exponential: e^{-0.4}.","answer":"y(0.2) = e^{-0.4} ≈ 0.6703"},{"prompt":"The numerical solution was 0.64, exact is 0.6703. What is the error?","hint":"Error = |exact - numerical|. Express as a percentage.","answer":"Error ≈ 0.0303 or 4.52%"}],"caption":"Euler's method is intuitive but accumulates error. RK4 evaluates the slope at intermediate points, reducing per-step error dramatically."}
```
