---
id: ode-second-order-nonhomo-worked-example
concept_id: ode-second-order-nonhomo
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
---

## GATE-Style Worked Example: Undetermined Coefficients

**Problem.** Solve:

$$y'' - 3y' + 2y = e^{3x}$$

---

### Step 1 — Complementary Function

The characteristic equation is:

$$r^2 - 3r + 2 = 0 \implies (r-1)(r-2) = 0$$

Roots: $r_1 = 1,\; r_2 = 2$ (distinct real).

$$y_h = C_1 e^{x} + C_2 e^{2x}$$

---

### Step 2 — Particular Integral via Undetermined Coefficients

The forcing term is $e^{3x}$. Since $r = 3$ is **not** a root of the characteristic equation, the trial solution is:

$$y_p = A e^{3x}$$

Compute derivatives:

$$y_p' = 3Ae^{3x}, \qquad y_p'' = 9Ae^{3x}$$

Substitute into the ODE:

$$9Ae^{3x} - 3(3Ae^{3x}) + 2(Ae^{3x}) = e^{3x}$$

$$e^{3x}(9A - 9A + 2A) = e^{3x}$$

$$2A = 1 \implies A = \frac{1}{2}$$

$$y_p = \frac{1}{2}e^{3x}$$

---

### Step 3 — General Solution

$$\boxed{y = C_1 e^{x} + C_2 e^{2x} + \frac{1}{2}e^{3x}}$$

---

### GATE Traps to Avoid

**Trap 1 — Resonance case.** If the forcing term were $e^{2x}$ (same as a root), the trial $Ae^{2x}$ would yield $0 = e^{2x}$. Instead use $Axe^{2x}$.

**Trap 2 — Sign error in the characteristic equation.** Write $y'' + py' + qy = f$ first, then read off $p$ and $q$ carefully. In this problem $p = -3$, $q = 2$.

**Trap 3 — Forgetting to add $y_h$.** The particular integral alone satisfies the equation, but not the initial/boundary conditions. The full general solution always includes $y_h$.

---

### Quick Verification

$$y = C_1 e^x + C_2 e^{2x} + \tfrac{1}{2}e^{3x}$$

$$y'' - 3y' + 2y = \bigl(C_1 e^x - 3C_1 e^x + 2C_1 e^x\bigr) + \bigl(4C_2 e^{2x} - 6C_2 e^{2x} + 2C_2 e^{2x}\bigr) + \tfrac{9-9+2}{2}e^{3x} = 0 + 0 + e^{3x} \checkmark$$

```interactive-spec
{"v":1,"kind":"guided_walkthrough","steps":[{"prompt":"The ODE is y'' − 3y' + 2y = e^(3x). Write down the characteristic equation and find its roots.","hint":"Replace y with e^(rx): r² − 3r + 2 = 0. Factor the left side.","answer":"r² − 3r + 2 = (r−1)(r−2) = 0, so r₁ = 1 and r₂ = 2. The complementary function is y_h = C₁eˣ + C₂e^(2x)."},{"prompt":"The forcing term is e^(3x). What is the correct trial solution y_p for undetermined coefficients, and what value of A does substitution give?","hint":"Since r = 3 is not a root of the characteristic equation, try y_p = Ae^(3x). Compute y_p'' − 3y_p' + 2y_p and match to e^(3x).","answer":"y_p = Ae^(3x) gives (9A − 9A + 2A)e^(3x) = e^(3x), so 2A = 1 and A = 1/2. Thus y_p = (1/2)e^(3x)."}]}
```
