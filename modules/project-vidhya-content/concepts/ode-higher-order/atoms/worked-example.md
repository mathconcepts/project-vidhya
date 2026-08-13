---
id: ode-higher-order-worked-example
concept_id: ode-higher-order
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
---

## GATE-Style Worked Example: Third-Order ODE

**Problem.** Find the general solution of:

$$y''' - 6y'' + 11y' - 6y = 0$$

---

### Step 1 — Write the Auxiliary Equation

Substitute $y = e^{rx}$:

$$r^3 - 6r^2 + 11r - 6 = 0$$

---

### Step 2 — Find the Roots

**Try integer roots** (rational root theorem: candidates are $\pm 1, \pm 2, \pm 3, \pm 6$):

$$r = 1:\; 1 - 6 + 11 - 6 = 0 \checkmark$$

Factor out $(r - 1)$:

$$r^3 - 6r^2 + 11r - 6 = (r-1)(r^2 - 5r + 6) = (r-1)(r-2)(r-3)$$

Roots: $r_1 = 1,\quad r_2 = 2,\quad r_3 = 3$ — all distinct and real.

---

### Step 3 — Write the General Solution

Each distinct real root $r_k$ contributes one basis function $e^{r_k x}$:

$$\boxed{y = C_1 e^{x} + C_2 e^{2x} + C_3 e^{3x}}$$

---

### Variant: What if Roots Were Repeated or Complex?

**If** the auxiliary equation were $r^3 - 3r^2 + 3r - 1 = (r-1)^3 = 0$ (triple root at $r = 1$):

$$y = (C_1 + C_2 x + C_3 x^2)\,e^x$$

**If** the auxiliary equation were $r^3 + r = r(r^2 + 1) = 0$ with roots $r = 0,\; \pm i$:

$$y = C_1 + C_2\cos(x) + C_3\sin(x)$$

(root $r = 0$ gives $e^{0 \cdot x} = 1$; complex pair $0 \pm i$ gives $\cos x$ and $\sin x$.)

---

### GATE Traps to Avoid

**Trap 1 — Wrong number of constants.** An $n$th-order ODE has exactly $n$ arbitrary constants. A third-order ODE must have $C_1, C_2, C_3$ — never two, never four.

**Trap 2 — Missing the $x^k$ factors for repeated roots.** A double root at $r$ gives $e^{rx}$ *and* $xe^{rx}$, not $e^{rx}$ twice with different constants (those are the same function).

**Trap 3 — Incorrect factoring.** Always verify your factors by substituting the claimed roots back into the auxiliary polynomial before writing the solution.

$$r = 2:\; 8 - 24 + 22 - 6 = 0 \checkmark \qquad r = 3:\; 27 - 54 + 33 - 6 = 0 \checkmark$$

```interactive-spec
{"v":1,"kind":"guided_walkthrough","steps":[{"prompt":"The ODE y''' − 6y'' + 11y' − 6y = 0 leads to the auxiliary equation r³ − 6r² + 11r − 6 = 0. How do you find the roots efficiently for a GATE problem?","hint":"Try small positive integers as candidates (rational root theorem). Substitute r = 1 into the polynomial first.","answer":"Substitute r = 1: 1 − 6 + 11 − 6 = 0 ✓. Divide out (r − 1) to get (r − 1)(r² − 5r + 6) = (r − 1)(r − 2)(r − 3). Roots are 1, 2, 3."},{"prompt":"Given three distinct real roots r = 1, 2, 3, write the general solution. How many arbitrary constants should it have, and why?","hint":"Each distinct root contributes one independent basis function e^(r·x). A third-order ODE needs exactly three independent solutions.","answer":"y = C₁eˣ + C₂e^(2x) + C₃e^(3x). Three constants because the ODE is third order — its solution space is 3-dimensional."}]}
```
