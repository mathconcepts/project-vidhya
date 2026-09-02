---
id: divergence-curl.worked-example
concept_id: divergence-curl
atom_type: worked_example
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** For $\mathbf F(x,y,z)=(xy,\ yz,\ zx)$, find $\operatorname{div}\mathbf F$ and $\operatorname{curl}\mathbf F$ at $(1,2,3)$, then verify $\operatorname{div}(\operatorname{curl}\mathbf F)=0$.

---

**Step 1 — Divergence, general.** $P=xy,\ Q=yz,\ R=zx$.

$$\operatorname{div}\mathbf F=\frac{\partial P}{\partial x}+\frac{\partial Q}{\partial y}+\frac{\partial R}{\partial z}=y+z+x$$

---

**Step 2 — Divergence at the point.** At $(1,2,3)$: $\operatorname{div}\mathbf F=1+2+3=6$.

---

**Step 3 — Curl, general.**

$$\operatorname{curl}\mathbf F=\left(\frac{\partial R}{\partial y}-\frac{\partial Q}{\partial z},\ \frac{\partial P}{\partial z}-\frac{\partial R}{\partial x},\ \frac{\partial Q}{\partial x}-\frac{\partial P}{\partial y}\right)=(0-y,\ 0-z,\ 0-x)=(-y,-z,-x)$$

---

**Step 4 — Curl at the point, and the identity check.** At $(1,2,3)$:

$$\boxed{\operatorname{div}\mathbf F=6,\quad \operatorname{curl}\mathbf F=(-2,-3,-1)}$$

$\operatorname{curl}\mathbf F=(-y,-z,-x)$ is itself a field; its divergence is $\partial_x(-y)+\partial_y(-z)+\partial_z(-x)=0+0+0=0$. **Check.** $\operatorname{div}(\operatorname{curl}\mathbf F)=0$ — the identity holds, as it must for any twice-differentiable $\mathbf F$.

```interactive-spec
{
  "v": 1,
  "kind": "guided_walkthrough",
  "title": "Walk through: div and curl of F = (xy, yz, zx) at (1,2,3)",
  "steps": [
    {
      "prompt": "Step 1: Write down P, Q, R for F = (xy, yz, zx).",
      "hint": "F = (P, Q, R) component by component.",
      "answer": "P = xy, Q = yz, R = zx"
    },
    {
      "prompt": "Step 2: Compute div F in general, then at (1,2,3).",
      "hint": "div F = ∂P/∂x + ∂Q/∂y + ∂R/∂z.",
      "answer": "div F = x+y+z; at (1,2,3): div F = 6",
      "eqn": "∂(xy)/∂x + ∂(yz)/∂y + ∂(zx)/∂z = y + z + x"
    },
    {
      "prompt": "Step 3: Compute curl F in general.",
      "hint": "curl F = (∂R/∂y − ∂Q/∂z, ∂P/∂z − ∂R/∂x, ∂Q/∂x − ∂P/∂y).",
      "answer": "curl F = (-y, -z, -x)",
      "eqn": "(∂(zx)/∂y − ∂(yz)/∂z, ∂(xy)/∂z − ∂(zx)/∂x, ∂(yz)/∂x − ∂(xy)/∂y) = (0-y, 0-z, 0-x)"
    },
    {
      "prompt": "Step 4: Evaluate curl F at (1,2,3) and check div(curl F) = 0.",
      "hint": "Substitute (1,2,3) into (-y,-z,-x), then take the divergence of the general curl expression.",
      "answer": "curl F at (1,2,3) = (-2,-3,-1); div(curl F) = 0"
    }
  ],
  "caption": "div(curl F) = 0 is a fixed identity — it must come out exactly zero for any twice-differentiable F, so a nonzero result here always means an arithmetic slip upstream."
}
```
