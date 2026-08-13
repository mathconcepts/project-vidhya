---
id: vector-fields-worked-example
concept_id: vector-fields
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
---

# Worked Example — GATE Style

**Problem:** Let $\mathbf{F} = (2xy)\,\hat{i} + (x^2 - y^2)\,\hat{j}$.

**(a)** Check whether $\mathbf{F}$ is conservative.

**(b)** If conservative, find the scalar potential $\phi$.

**(c)** Evaluate $\int_C \mathbf{F} \cdot d\mathbf{r}$ along $y = x$ from $(0,0)$ to $(1,1)$.

---

## Step 1 — Check for Conservative Field

For a 2D field $\mathbf{F} = (P, Q)$, the field is conservative iff:

$$\frac{\partial Q}{\partial x} = \frac{\partial P}{\partial y}$$

Here $P = 2xy$ and $Q = x^2 - y^2$.

$$\frac{\partial Q}{\partial x} = 2x \qquad \frac{\partial P}{\partial y} = 2x$$

Since $\frac{\partial Q}{\partial x} = \frac{\partial P}{\partial y} = 2x$, the field **is conservative**.

---

## Step 2 — Find the Scalar Potential $\phi$

We need $\phi$ such that $\nabla\phi = \mathbf{F}$, i.e.:

$$\frac{\partial\phi}{\partial x} = 2xy \qquad \frac{\partial\phi}{\partial y} = x^2 - y^2$$

**Integrate the first equation** with respect to $x$:

$$\phi = x^2 y + g(y)$$

where $g(y)$ is an unknown function of $y$ only.

**Differentiate** with respect to $y$ and match the second equation:

$$\frac{\partial\phi}{\partial y} = x^2 + g'(y) = x^2 - y^2$$

$$\Rightarrow g'(y) = -y^2 \Rightarrow g(y) = -\frac{y^3}{3} + C$$

**Scalar potential:**

$$\boxed{\phi(x,y) = x^2 y - \frac{y^3}{3} + C}$$

---

## Step 3 — Evaluate the Line Integral

Since $\mathbf{F}$ is conservative, the path does not matter. Use the potential directly:

$$\int_C \mathbf{F} \cdot d\mathbf{r} = \phi(1,1) - \phi(0,0)$$

$$\phi(1,1) = (1)^2(1) - \frac{(1)^3}{3} = 1 - \frac{1}{3} = \frac{2}{3}$$

$$\phi(0,0) = 0$$

$$\boxed{\int_C \mathbf{F} \cdot d\mathbf{r} = \frac{2}{3}}$$

---

## Verification — Direct Parametric Integration

Along $y = x$, parametrize with $t \in [0,1]$: $x = t$, $y = t$, $dx = dt$, $dy = dt$.

$$\int_C \mathbf{F} \cdot d\mathbf{r} = \int_0^1 \bigl[2t \cdot t\,dt + (t^2 - t^2)\,dt\bigr] = \int_0^1 2t^2\,dt = \frac{2}{3} \checkmark$$

---

## GATE Exam Strategy

1. **Always check curl/mixed partials first.** If conservative, potential method saves computation.
2. **If not conservative**, parametrize the given path and integrate directly.
3. **For closed paths** on conservative fields: integral is always zero — instant MCQ answer.
4. **Partial derivative order:** $\frac{\partial Q}{\partial x}$ vs $\frac{\partial P}{\partial y}$ — a common sign-error trap.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","steps":[{"prompt":"For F = (2xy, x² − y²), compute ∂Q/∂x where Q = x² − y².","hint":"Differentiate x² − y² with respect to x, treating y as constant.","answer":"∂Q/∂x = 2x"},{"prompt":"Now compute ∂P/∂y where P = 2xy, and state whether F is conservative.","hint":"Differentiate 2xy with respect to y, treating x as constant. Then compare with ∂Q/∂x.","answer":"∂P/∂y = 2x. Since ∂Q/∂x = ∂P/∂y = 2x, F is conservative."},{"prompt":"Using the scalar potential φ = x²y − y³/3, evaluate ∫_C F·dr from (0,0) to (1,1).","hint":"For a conservative field, ∫_C F·dr = φ(endpoint) − φ(startpoint). Plug in (1,1) and (0,0).","answer":"φ(1,1) − φ(0,0) = (1 − 1/3) − 0 = 2/3"}]}
```
