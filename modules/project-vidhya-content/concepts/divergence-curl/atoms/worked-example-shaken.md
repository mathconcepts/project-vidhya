---
# Alternative body for divergence-curl.worked-example, served when the
# learner stance is `shaken`. Prose held at or below the base atom's
# length; the extra steps live in the walkthrough below.
id: divergence-curl.worked-example.shaken
concept_id: divergence-curl
atom_type: worked_example
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
variant_of: divergence-curl.worked-example
for_stance: shaken
---

**Problem:** $\mathbf F(x,y,z)=(xy,\ yz,\ zx)$. Find $\operatorname{div}\mathbf F$ and $\operatorname{curl}\mathbf F$ at $(1,2,3)$.

---

**Step 1 — Name $P,Q,R$.** $P=xy,\ Q=yz,\ R=zx$.

---

**Step 2 — Divergence.** $\operatorname{div}\mathbf F=\partial_xP+\partial_yQ+\partial_zR=y+z+x$. At $(1,2,3)$: $1+2+3=6$.

---

**Step 3 — Curl, one component at a time.** $\partial_yR-\partial_zQ=0-y=-y$. $\partial_zP-\partial_xR=0-z=-z$. $\partial_xQ-\partial_yP=0-x=-x$.

$$\operatorname{curl}\mathbf F=(-y,-z,-x)$$

---

**Step 4 — Evaluate and check.** At $(1,2,3)$:

$$\boxed{\operatorname{div}\mathbf F=6,\quad \operatorname{curl}\mathbf F=(-2,-3,-1)}$$

$\operatorname{div}(\operatorname{curl}\mathbf F)=\partial_x(-y)+\partial_y(-z)+\partial_z(-x)=0+0+0=0$.

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
