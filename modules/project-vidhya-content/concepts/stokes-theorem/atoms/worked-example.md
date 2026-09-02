---
id: stokes-theorem-worked-example
concept_id: stokes-theorem
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
---

# Worked Example — GATE Style

**Problem:** Verify Stokes' theorem for $\mathbf{F} = y\,\hat{i} - x\,\hat{j} + z\,\hat{k}$ over the upper hemisphere $S: x^2 + y^2 + z^2 = 1,\; z \geq 0$, with the boundary $C$ being the unit circle $x^2 + y^2 = 1$ in the $z=0$ plane, traversed counterclockwise.

Compute both sides: $\oint_C \mathbf{F} \cdot d\mathbf{r}$ and $\iint_S (\nabla \times \mathbf{F}) \cdot d\mathbf{S}$.

---

## Step 1 — Compute the Curl of F

$$\mathbf{F} = (F_x, F_y, F_z) = (y, -x, z)$$

$$\nabla \times \mathbf{F} = \begin{vmatrix} \hat{i} & \hat{j} & \hat{k} \\ \partial_x & \partial_y & \partial_z \\ y & -x & z \end{vmatrix}$$

**$\hat{i}$:** $\partial_y(z) - \partial_z(-x) = 0 - 0 = 0$

**$\hat{j}$:** $-[\partial_x(z) - \partial_z(y)] = -[0 - 0] = 0$

**$\hat{k}$:** $\partial_x(-x) - \partial_y(y) = -1 - 1 = -2$

$$\nabla \times \mathbf{F} = -2\,\hat{k}$$

---

## Step 2 — Surface Integral (Right Side of Stokes)

**Smart move:** Replace the hemisphere with the flat disk $D: x^2 + y^2 \leq 1,\, z = 0$. They share the same boundary $C$, so Stokes gives the same answer for either surface.

On the disk: $\hat{n} = \hat{k}$ (upward normal, consistent with counterclockwise $C$ by right-hand rule), $d\mathbf{S} = \hat{k}\,dA$.

$$\iint_S (\nabla \times \mathbf{F}) \cdot d\mathbf{S} = \iint_D (-2\hat{k}) \cdot \hat{k}\,dA = -2 \iint_D dA = -2 \cdot \pi(1)^2 = -2\pi$$

---

## Step 3 — Line Integral (Left Side of Stokes)

Parametrize $C$: $x = \cos\theta$, $y = \sin\theta$, $z = 0$, $\theta \in [0, 2\pi]$ (counterclockwise).

$$d\mathbf{r} = (-\sin\theta\,d\theta)\,\hat{i} + (\cos\theta\,d\theta)\,\hat{j} + 0\,\hat{k}$$

On $C$: $F_x = y = \sin\theta$, $F_y = -x = -\cos\theta$, $F_z = z = 0$.

$$\oint_C \mathbf{F} \cdot d\mathbf{r} = \int_0^{2\pi} \left[\sin\theta(-\sin\theta) + (-\cos\theta)(\cos\theta)\right] d\theta$$

$$= \int_0^{2\pi} (-\sin^2\theta - \cos^2\theta)\,d\theta = \int_0^{2\pi} (-1)\,d\theta = -2\pi$$

---

## Verification

$$\oint_C \mathbf{F} \cdot d\mathbf{r} = -2\pi = \iint_S (\nabla \times \mathbf{F}) \cdot d\mathbf{S} \checkmark$$

Stokes' theorem is verified.

$$\boxed{\oint_C \mathbf{F} \cdot d\mathbf{r} = \iint_S (\nabla \times \mathbf{F}) \cdot d\mathbf{S} = -2\pi}$$

---

## GATE Exam Strategy

1. **Always compute the curl first** — it determines whether either side is zero immediately.
2. **Swap surfaces freely** — the flat disk is almost always easier than a curved hemisphere.
3. **Orientation check:** counterclockwise $C$ (viewed from above) → upward $\hat{n}$ on $S$.
4. **$\sin^2\theta + \cos^2\theta = 1$** saves the day in the line integral — recognize the pattern.
5. If $\nabla \times \mathbf{F} = \mathbf{0}$, both sides are 0 immediately.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: verifying Stokes' theorem for F = (y, −x, z)","steps":[{"prompt":"Compute the k̂ component of curl F for F = (y, −x, z).","hint":"The k̂ component is ∂F_y/∂x − ∂F_x/∂y. Here F_y = −x and F_x = y.","answer":"∂(−x)/∂x − ∂(y)/∂y = −1 − 1 = −2. So curl F = −2k̂."},{"prompt":"Using the flat disk D (x²+y²≤1, z=0) instead of the hemisphere, compute ∬_D (curl F)·n̂ dA.","hint":"On the disk, n̂ = k̂ and dS = dA. So the integrand is (−2k̂)·k̂ = −2. Integrate over the unit disk.","answer":"−2 × area(unit disk) = −2π"},{"prompt":"Parametrize C as (cosθ, sinθ, 0). Compute F·dr and integrate from 0 to 2π.","hint":"F = (sinθ, −cosθ, 0) and dr = (−sinθ, cosθ, 0)dθ. Dot product = −sin²θ − cos²θ = −1.","answer":"∫₀²π (−1) dθ = −2π. This matches the surface integral, verifying Stokes' theorem."}]}
```
