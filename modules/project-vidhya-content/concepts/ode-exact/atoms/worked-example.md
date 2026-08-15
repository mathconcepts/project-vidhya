---
id: ode-exact-worked-example
concept_id: ode-exact
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
---

## GATE-Style Worked Example: Solving an Exact ODE

**Problem.** Solve the ODE:

$$(2xy + 3x^2)\,dx + (x^2 + 4y^3)\,dy = 0$$

---

### Step 1 — Identify $M$ and $N$

$$M(x,y) = 2xy + 3x^2, \qquad N(x,y) = x^2 + 4y^3$$

---

### Step 2 — Check the Exactness Condition

$$\frac{\partial M}{\partial y} = 2x \qquad \frac{\partial N}{\partial x} = 2x$$

Since $\dfrac{\partial M}{\partial y} = \dfrac{\partial N}{\partial x}$, the equation **is exact**.

---

### Step 3 — Integrate $M$ with Respect to $x$

$$F(x,y) = \int M\,dx = \int (2xy + 3x^2)\,dx = x^2 y + x^3 + g(y)$$

Here $g(y)$ is an arbitrary function of $y$ (the "constant" of integration when $x$ is the variable).

---

### Step 4 — Determine $g(y)$ Using $\partial F/\partial y = N$

$$\frac{\partial F}{\partial y} = x^2 + g'(y) \stackrel{!}{=} N = x^2 + 4y^3$$

$$\Rightarrow g'(y) = 4y^3 \implies g(y) = y^4 + C_0$$

---

### Step 5 — Write the General Solution

$$\boxed{F(x,y) = x^2 y + x^3 + y^4 = C}$$

---

### GATE Trap to Avoid

> Do **not** forget that $g(y)$ is found from the $y$-derivative of $F$, not from $M$. A common error is to integrate $N$ with respect to $y$ independently and then "add" the two results — this double-counts terms that appear in both integrals.

The correct check: after finding $F$, verify $\frac{\partial F}{\partial x} = M$ and $\frac{\partial F}{\partial y} = N$.

$$\frac{\partial}{\partial x}(x^2 y + x^3 + y^4) = 2xy + 3x^2 = M \checkmark$$
$$\frac{\partial}{\partial y}(x^2 y + x^3 + y^4) = x^2 + 4y^3 = N \checkmark$$

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: solving the exact ODE (2xy+3x²)dx + (x²+4y³)dy = 0","steps":[{"prompt":"What is the exactness condition that must hold for M dx + N dy = 0 to be exact?","hint":"It relates a partial derivative of M to a partial derivative of N. Think about mixed second-order partials of the potential function F.","answer":"∂M/∂y = ∂N/∂x. This ensures the mixed partials of F are equal, so F exists."},{"prompt":"After integrating M = 2xy + 3x² with respect to x, we get F = x²y + x³ + g(y). How do we find g(y)?","hint":"Differentiate F with respect to y and set the result equal to N = x² + 4y³.","answer":"∂F/∂y = x² + g′(y) = x² + 4y³, so g′(y) = 4y³ and g(y) = y⁴. The general solution is x²y + x³ + y⁴ = C."}]}
```
