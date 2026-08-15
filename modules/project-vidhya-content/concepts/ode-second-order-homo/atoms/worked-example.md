---
id: ode-second-order-homo.worked-example
concept_id: ode-second-order-homo
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
---

## Worked Example: Solve the Homogeneous ODE

**Problem (GATE-style):**

Solve the differential equation:
$$y'' - 3y' + 2y = 0$$

with general form of the solution.

---

## Step-by-Step Solution

**Step 1: Form the characteristic equation**

Assume $y = e^{rx}$. Then:
- $y' = re^{rx}$
- $y'' = r^2e^{rx}$

Substitute into the ODE:
$$r^2e^{rx} - 3re^{rx} + 2e^{rx} = 0$$

Factor out $e^{rx}$ (which is never zero):
$$r^2 - 3r + 2 = 0$$

This is the characteristic equation.

**Step 2: Solve the characteristic equation**

Factor the quadratic:
$$r^2 - 3r + 2 = (r - 1)(r - 2) = 0$$

Therefore: $r_1 = 1$ and $r_2 = 2$ (two distinct real roots)

**Step 3: Write the general solution**

When the characteristic equation has two distinct real roots $r_1$ and $r_2$, the general solution is:
$$y = c_1 e^{r_1 x} + c_2 e^{r_2 x}$$

Substituting our roots:
$$\boxed{y = c_1 e^x + c_2 e^{2x}}$$

where $c_1$ and $c_2$ are arbitrary constants determined by initial conditions.

**Verification:** Differentiate $y = c_1 e^x + c_2 e^{2x}$:
- $y' = c_1 e^x + 2c_2 e^{2x}$
- $y'' = c_1 e^x + 4c_2 e^{2x}$

Check: $y'' - 3y' + 2y = (c_1 e^x + 4c_2 e^{2x}) - 3(c_1 e^x + 2c_2 e^{2x}) + 2(c_1 e^x + c_2 e^{2x})$
$= c_1 e^x(1 - 3 + 2) + c_2 e^{2x}(4 - 6 + 2) = 0$ ✓

---

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: y'' - 3y' + 2y = 0","steps":[{"prompt":"Step 1: Assume $y = e^{rx}$ and find $y'$ and $y''$.","hint":"Use the chain rule: if $y = e^{rx}$ then $y' = re^{rx}$ and $y'' = r^2 e^{rx}$.","answer":"$y' = re^{rx}$ and $y'' = r^2 e^{rx}$"},{"prompt":"Step 2: Substitute into $y'' - 3y' + 2y = 0$ and factor out $e^{rx}$.","hint":"You should get $e^{rx}(r^2 - 3r + 2) = 0$. Since $e^{rx} \\neq 0$, set the bracket to zero.","answer":"The characteristic equation is $r^2 - 3r + 2 = 0$."},{"prompt":"Step 3: Factor the quadratic $r^2 - 3r + 2 = 0$ to find both roots.","hint":"Look for two numbers that multiply to 2 and add to -3. They are -1 and -2.","answer":"$(r - 1)(r - 2) = 0$, so $r_1 = 1$ and $r_2 = 2$."},{"prompt":"Step 4: Write the general solution for two distinct real roots.","hint":"The formula is $y = c_1 e^{r_1 x} + c_2 e^{r_2 x}$.","answer":"$y = c_1 e^x + c_2 e^{2x}$"}],"caption":"Key exam insight: characteristic equation → roots → general solution. The formula structure is the same for all second-order homogeneous ODEs."}
```


---

**DONE:ode-second-order-homo**
