---
# Alternative body for divergence-curl.worked-example, served when the
# learner stance is `assured`. Terse, assumes the mechanics, spends its
# words on the distinction that costs marks.
id: divergence-curl.worked-example.assured
concept_id: divergence-curl
atom_type: worked_example
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
variant_of: divergence-curl.worked-example
for_stance: assured
---

**Problem:** $\mathbf F(x,y,z)=(xy,\ yz,\ zx)$. Find $\operatorname{div}\mathbf F$, $\operatorname{curl}\mathbf F$ at $(1,2,3)$, verify $\operatorname{div}(\operatorname{curl}\mathbf F)=0$.

**By the cyclic pattern.** $P,Q,R$ cycle $x\to y\to z\to x$, so $\operatorname{div}\mathbf F=y+z+x$ and $\operatorname{curl}\mathbf F=(-y,-z,-x)$ follow from computing one component and cycling the variables — no need to redo the derivative three times from scratch.

$$\boxed{\operatorname{div}\mathbf F|_{(1,2,3)}=6,\quad \operatorname{curl}\mathbf F|_{(1,2,3)}=(-2,-3,-1)}$$

**Worth knowing.** The field's cyclic symmetry does *not* imply zero curl — a tempting shortcut, since a symmetric-looking field can feel like it "shouldn't spin." $\mathbf F$ is a counterexample sitting right here: fully cyclic, and nonzero curl at every point off the coordinate axes. Symmetry constrains the *shape* of curl (also cyclic), never guarantees it vanishes.

Check: $\operatorname{div}(\operatorname{curl}\mathbf F)=\partial_x(-y)+\partial_y(-z)+\partial_z(-x)=0$, as the identity requires.

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
