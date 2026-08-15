---
id: surface-integrals.worked_example
concept_id: surface-integrals
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
---

## Worked Example: Flux Through a Sphere

**Problem (GATE-style):**

Evaluate the surface integral $\iint_S \mathbf{F} \cdot \mathbf{n} \, dS$ where $\mathbf{F} = (x, y, z)$ and $S$ is the sphere $x^2 + y^2 + z^2 = 4$ with outward-pointing normal.

**Solution:**

**Step 1: Parameterize the sphere**

Use spherical coordinates:
$$x = 2\sin\theta\cos\phi, \quad y = 2\sin\theta\sin\phi, \quad z = 2\cos\theta$$
where $0 \le \theta \le \pi$ and $0 \le \phi \le 2\pi$.

**Step 2: Compute the normal vector**

The outward unit normal is:
$$\mathbf{n} = \frac{1}{2}(x, y, z) = (\sin\theta\cos\phi, \sin\theta\sin\phi, \cos\theta)$$

The surface element is:
$$dS = 4\sin\theta \, d\theta \, d\phi$$

**Step 3: Evaluate $\mathbf{F} \cdot \mathbf{n}$**

$$\mathbf{F} \cdot \mathbf{n} = (2\sin\theta\cos\phi, 2\sin\theta\sin\phi, 2\cos\theta) \cdot (\sin\theta\cos\phi, \sin\theta\sin\phi, \cos\theta)$$

$$= 2\sin^2\theta\cos^2\phi + 2\sin^2\theta\sin^2\phi + 2\cos^2\theta$$

$$= 2\sin^2\theta(\cos^2\phi + \sin^2\phi) + 2\cos^2\theta$$

$$= 2\sin^2\theta + 2\cos^2\theta = 2$$

**Step 4: Integrate**

$$\iint_S \mathbf{F} \cdot \mathbf{n} \, dS = \int_0^{2\pi} \int_0^{\pi} 2 \cdot 4\sin\theta \, d\theta \, d\phi$$

$$= 8 \int_0^{2\pi} d\phi \int_0^{\pi} \sin\theta \, d\theta$$

$$= 8 \cdot 2\pi \cdot [-\cos\theta]_0^{\pi}$$

$$= 8 \cdot 2\pi \cdot 2 = 32\pi$$

**Answer:** The flux through the sphere is $32\pi$.

---

### Key Insight: Divergence Theorem Check

By the divergence theorem, this should equal $\iiint_V \nabla \cdot \mathbf{F} \, dV$ where $V$ is the ball interior.

$$\nabla \cdot \mathbf{F} = \frac{\partial x}{\partial x} + \frac{\partial y}{\partial y} + \frac{\partial z}{\partial z} = 3$$

$$\iiint_V 3 \, dV = 3 \cdot \frac{4}{3}\pi(2)^3 = 3 \cdot \frac{32\pi}{3} = 32\pi$$ ✓

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Sphere flux calculation","steps":[{"prompt":"Step 1: Write the parameterization of sphere $x^2+y^2+z^2=4$. What are $x(\\theta,\\phi)$, $y(\\theta,\\phi)$, and $z(\\theta,\\phi)$?","hint":"Use spherical coordinates with radius 2. Recall $x=R\\sin\\theta\\cos\\phi$.","answer":"$x=2\\sin\\theta\\cos\\phi$, $y=2\\sin\\theta\\sin\\phi$, $z=2\\cos\\theta$"},{"prompt":"Step 2: For the outward normal on the sphere, express $\\mathbf{n}$ in terms of $(x,y,z)$ and simplify.","hint":"The outward normal is proportional to the position vector $(x,y,z)$. Normalize by the radius.","answer":"$\\mathbf{n} = \\frac{1}{2}(x,y,z) = (\\sin\\theta\\cos\\phi, \\sin\\theta\\sin\\phi, \\cos\\theta)$"},{"prompt":"Step 3: Compute $\\mathbf{F} \\cdot \\mathbf{n}$ where $\\mathbf{F}=(x,y,z)$ at the surface.","hint":"Substitute the parameterization and use $\\cos^2\\phi + \\sin^2\\phi = 1$ and $\\sin^2\\theta + \\cos^2\\theta = 1$.","answer":"$\\mathbf{F} \\cdot \\mathbf{n} = 2$"},{"prompt":"Step 4: Set up the double integral with $dS = 4\\sin\\theta\\,d\\theta\\,d\\phi$ and integrate over $\\theta \\in [0,\\pi]$, $\\phi \\in [0,2\\pi]$.","hint":"The constant value of 2 makes this straightforward. Integrate $\\sin\\theta$ first.","answer":"$\\iint_S \\mathbf{F}\\cdot\\mathbf{n}\\,dS = 32\\pi$"}],"caption":"Flux through a sphere: parameterization → normal → dot product → integration. Standard GATE technique."}
```

---

**DONE:surface-integrals**
