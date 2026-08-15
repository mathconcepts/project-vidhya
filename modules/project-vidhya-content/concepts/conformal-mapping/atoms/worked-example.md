---
id: conformal-mapping.worked-example
concept_id: conformal-mapping
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:**

Show that the mapping $f(z) = z + \frac{1}{z}$ is conformal everywhere except at $z = 0$ and $z = \pm 1$.

**Solution:**

A transformation $f(z)$ is conformal at a point if:
1. $f$ is analytic (holomorphic) at that point, and
2. $f'(z) \neq 0$ at that point.

**Step 1: Check analyticity**

The function $f(z) = z + \frac{1}{z}$ is a sum of two functions:
- $z$ is entire (analytic everywhere).
- $\frac{1}{z}$ is analytic everywhere except at $z = 0$ (simple pole).

Therefore, $f$ is analytic on $\mathbb{C} \setminus \{0\}$.

**Step 2: Compute the derivative**

$$f'(z) = \frac{d}{dz}\left(z + \frac{1}{z}\right) = 1 - \frac{1}{z^2}$$

**Step 3: Find critical points where $f'(z) = 0$**

Set $f'(z) = 0$:
$$1 - \frac{1}{z^2} = 0$$
$$z^2 = 1$$
$$z = \pm 1$$

At these critical points, the mapping is *not* conformal because angles are not preserved locally (the derivative vanishes, so the magnification factor becomes zero—the region collapses).

**Step 4: Identify the conformal region**

Combining steps 1 and 3: $f(z) = z + \frac{1}{z}$ is conformal on:
$$\boxed{\mathbb{C} \setminus \{0, 1, -1\}}$$

The mapping fails to be conformal at:
- $z = 0$ (pole—not analytic)
- $z = \pm 1$ (critical points—$f'(z) = 0$)

**Exam insight:** 

Always check *both* conditions for conformality. The Joukowski transformation is a workhorse in aerodynamics precisely because it's conformal on the domain $|z| > 1$ (outside the unit disk), where it maps circles to airfoil profiles while preserving the physics of potential flow.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Joukowski conformal condition","steps":[{"prompt":"Step 1: Is $f(z) = z + 1/z$ analytic on $\\mathbb{C}$?","hint":"What singularities does $1/z$ have?","answer":"No. $f$ has a pole at $z=0$, so it is analytic on $\\mathbb{C} \\setminus \\{0\\}$."},{"prompt":"Step 2: Compute $f'(z)$.","hint":"Differentiate term-by-term. Recall $(z^{-1})' = -z^{-2}$.","answer":"$f'(z) = 1 - 1/z^2$."},{"prompt":"Step 3: Solve $f'(z) = 0$ for critical points.","hint":"Set $1 - 1/z^2 = 0$, multiply by $z^2$, and solve.","answer":"$z^2 = 1$, so $z = 1$ or $z = -1$ are the critical points."},{"prompt":"Step 4: Where is $f$ conformal?","hint":"Conformal = analytic AND $f'(z) \\neq 0$. Exclude the pole and critical points.","answer":"$f$ is conformal on $\\mathbb{C} \\setminus \\{0, 1, -1\\}$."}],"caption":"At a critical point, the conformal property breaks: angles collapse."}
```

---

Due to permission handler configuration issues with the Write tool, I am unable to directly create these files on disk. However, I have provided the complete, ready-to-use markdown content for all three atoms above. 

These files should be created at:
1.
