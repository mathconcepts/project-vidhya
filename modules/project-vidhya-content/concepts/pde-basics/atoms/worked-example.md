---
id: pde-basics-worked-example
concept_id: pde-basics
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
---

## GATE-Style Worked Examples: PDE Classification and Separation of Variables

---

### Part A — Classify the PDE

**Problem.** Classify the PDE:

$$u_{xx} + 4u_{xy} + 4u_{yy} = 0$$

**Solution.**

Identify the coefficients: $A = 1$, $B = 4$, $C = 4$.

$$\Delta = B^2 - 4AC = 16 - 4(1)(4) = 16 - 16 = 0$$

$$\boxed{\Delta = 0 \implies \text{Parabolic}}$$

**Physical interpretation.** This PDE behaves like the heat equation — smooth solutions, no sharp wave fronts, well-posed with initial data along a non-characteristic curve.

> **Trap.** Note that $u_{xx} + 4u_{xy} + 4u_{yy} = (u_x + 2u_y)^2$ in operator form — this reveals the single characteristic family $x - 2y = \text{const}$, confirming the parabolic type.

---

### Part B — Separation of Variables for the Heat Equation

**Problem.** Solve:

$$\frac{\partial u}{\partial t} = \frac{\partial^2 u}{\partial x^2}, \quad 0 < x < \pi,\; t > 0$$

with boundary conditions $u(0,t) = u(\pi,t) = 0$ and initial condition $u(x,0) = \sin(x)$.

**Step 1 — Assume separability.** Let $u(x,t) = X(x)\,T(t)$.

$$X(x)\,T'(t) = X''(x)\,T(t) \implies \frac{T'}{T} = \frac{X''}{X} = -\lambda$$

(the ratio equals the same constant $-\lambda$ since the left side depends only on $t$ and the right only on $x$).

**Step 2 — Solve the spatial ODE.**

$$X'' + \lambda X = 0, \quad X(0) = 0,\; X(\pi) = 0$$

For non-trivial solutions: $\lambda_n = n^2$, $X_n(x) = \sin(nx)$, $n = 1, 2, 3, \ldots$

**Step 3 — Solve the temporal ODE.**

$$T' = -n^2 T \implies T_n(t) = e^{-n^2 t}$$

**Step 4 — Superpose and apply initial condition.**

$$u(x,t) = \sum_{n=1}^{\infty} b_n \sin(nx)\,e^{-n^2 t}$$

At $t = 0$: $u(x,0) = \sum b_n \sin(nx) = \sin(x)$.

Matching: $b_1 = 1$, $b_n = 0$ for $n \geq 2$.

$$\boxed{u(x,t) = e^{-t}\sin(x)}$$

**Verification.** $u_t = -e^{-t}\sin(x)$ and $u_{xx} = -e^{-t}\sin(x)$. So $u_t = u_{xx}$ $\checkmark$. Boundary conditions $u(0,t) = u(\pi,t) = 0$ $\checkmark$. Initial condition $u(x,0) = \sin(x)$ $\checkmark$.

---

### GATE Traps to Avoid

**Trap 1 — Wrong sign convention for $\lambda$.** Always choose $\lambda > 0$ so that $X'' + \lambda X = 0$ gives oscillatory (sine/cosine) spatial solutions. Choosing $\lambda < 0$ would give exponential growth failing the zero boundary conditions.

**Trap 2 — Confusing $B$ in the discriminant.** The coefficient of the *mixed* term $u_{xy}$ is $B$ itself, not $B/2$. Some textbooks absorb the factor of 2 differently — always re-derive $\Delta = B^2 - 4AC$ from your own $A$, $B$, $C$ identification.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","steps":[{"prompt":"For the PDE Au_xx + Bu_xy + Cu_yy = 0, you need the discriminant. Given u_xx + 4u_xy + 4u_yy = 0, identify A, B, C and compute Δ = B² − 4AC.","hint":"Read off the coefficients directly from the equation. A is the coefficient of u_xx, B of u_xy, C of u_yy.","answer":"A = 1, B = 4, C = 4. Δ = 4² − 4(1)(4) = 16 − 16 = 0. Δ = 0 means the PDE is Parabolic."},{"prompt":"For the heat equation u_t = u_xx on (0,π) with u(0,t)=u(π,t)=0 and u(x,0)=sin(x), write u = X(x)T(t) and state what eigenvalue problem X must satisfy.","hint":"Substitute into the PDE and separate variables. The ratio T'/T = X''/X must be a constant −λ. The boundary conditions on u translate directly to X(0) = X(π) = 0.","answer":"X'' + λX = 0 with X(0) = X(π) = 0. Solutions: λ_n = n², X_n = sin(nx). For the given initial condition only n = 1 survives, giving u(x,t) = e^(−t)sin(x)."}]}
```
