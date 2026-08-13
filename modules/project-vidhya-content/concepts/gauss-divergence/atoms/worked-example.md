---
id: gauss-divergence-worked-example
concept_id: gauss-divergence
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
---

# Worked Example — GATE Style

**Problem:** Evaluate $\oiint_S \mathbf{F} \cdot d\mathbf{S}$ where $\mathbf{F} = x\,\hat{i} + y\,\hat{j} + z\,\hat{k}$ over the closed sphere $S: x^2 + y^2 + z^2 = 4$ (radius 2), with outward normal.

Apply Gauss's divergence theorem.

---

## Step 1 — Compute Divergence

$$\nabla \cdot \mathbf{F} = \frac{\partial x}{\partial x} + \frac{\partial y}{\partial y} + \frac{\partial z}{\partial z} = 1 + 1 + 1 = 3$$

The divergence is constant — the ideal scenario for Gauss's theorem.

---

## Step 2 — Apply the Theorem

Let $V$ be the solid ball $x^2 + y^2 + z^2 \leq 4$ enclosed by $S$.

$$\oiint_S \mathbf{F} \cdot d\mathbf{S} = \iiint_V (\nabla \cdot \mathbf{F})\,dV = \iiint_V 3\,dV = 3 \cdot \text{Vol}(V)$$

---

## Step 3 — Volume of the Sphere

Radius $R = 2$:

$$\text{Vol}(V) = \frac{4}{3}\pi R^3 = \frac{4}{3}\pi (2)^3 = \frac{32\pi}{3}$$

---

## Step 4 — Final Answer

$$\oiint_S \mathbf{F} \cdot d\mathbf{S} = 3 \times \frac{32\pi}{3} = \boxed{32\pi}$$

---

## What Direct Integration Would Look Like (for comparison)

On the sphere $r = 2$, the outward unit normal is $\hat{n} = \frac{1}{2}(x, y, z)$ and $dS = 4\,d\Omega$ (where $d\Omega$ is the solid angle element, total $4\pi$). Then:

$$\mathbf{F} \cdot \hat{n} = \frac{x^2 + y^2 + z^2}{2} = \frac{4}{2} = 2 \quad \text{(constant on the sphere!)}$$

$$\oiint_S \mathbf{F} \cdot d\mathbf{S} = 2 \cdot \text{Surface area} = 2 \cdot 4\pi(2)^2 = 2 \cdot 16\pi = 32\pi \checkmark$$

Both methods agree. Gauss was faster.

---

## Extension: $\mathbf{F} = (x^3, y^3, z^3)$

$$\nabla \cdot \mathbf{F} = 3x^2 + 3y^2 + 3z^2 = 3r^2$$

Using spherical coordinates ($dV = r^2 \sin\phi\,dr\,d\phi\,d\theta$, $r$ from $0$ to $2$):

$$\iiint_V 3r^2\,dV = 3 \int_0^{2\pi} d\theta \int_0^\pi \sin\phi\,d\phi \int_0^2 r^2 \cdot r^2\,dr = 3 \cdot 2\pi \cdot 2 \cdot \frac{32}{5} = \frac{384\pi}{5}$$

Direct surface integration of $x^3\hat{n}_x + y^3\hat{n}_y + z^3\hat{n}_z$ over a sphere would be brutal — Gauss saves significant work.

---

## GATE Exam Strategy

1. **Compute div F first.** If it is constant, Gauss is almost instant: constant $\times$ volume.
2. **Volume formulas to memorize:**
   - Sphere radius $R$: $\frac{4}{3}\pi R^3$
   - Cylinder radius $R$, height $h$: $\pi R^2 h$
   - Cube side $a$: $a^3$
3. **Outward normal** — if the problem says "inward," flip the sign at the end.
4. **Singularities:** if $\mathbf{F}$ blows up at a point inside $V$, the theorem needs modification — common GATE trap for $\mathbf{F} = \hat{r}/r^2$.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","steps":[{"prompt":"For F = (x, y, z), compute div F = ∂F_x/∂x + ∂F_y/∂y + ∂F_z/∂z.","hint":"Each component differentiates to 1. Sum the three results.","answer":"1 + 1 + 1 = 3"},{"prompt":"The sphere x²+y²+z²=4 has radius R=2. Write the volume integral that Gauss's theorem gives you.","hint":"∯_S F·dS = ∭_V (div F) dV = 3 × Vol(V). The volume of a sphere of radius R is (4/3)πR³.","answer":"3 × (4/3)π(2)³ = 3 × (32π/3) = 32π"},{"prompt":"Verify directly: on the sphere r=2, show F·n̂ is constant and compute the surface integral.","hint":"The outward unit normal is n̂ = r̂ = (x,y,z)/2. F·n̂ = (x²+y²+z²)/2. On the sphere, x²+y²+z²=4.","answer":"F·n̂ = 4/2 = 2 everywhere. Surface area = 4π(2²) = 16π. Integral = 2 × 16π = 32π ✓"}]}
```
