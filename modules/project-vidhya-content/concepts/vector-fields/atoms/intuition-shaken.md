---
# Alternative body for vector-fields.intuition, served when the learner
# stance is `shaken`. Concrete-first, smallest true step, arithmetic shown
# in full, explicit check at the end.
id: vector-fields.intuition.shaken
concept_id: vector-fields
atom_type: intuition
bloom_level: 2
difficulty: 0.10
exam_ids: ["*"]
modality: visual
variant_of: vector-fields.intuition
for_stance: shaken
---

Take $\phi(x,y)=\tfrac12(x^2+y^2)$, height on a bowl-shaped surface.

**Step 1 — differentiate.** $\dfrac{\partial\phi}{\partial x}=x$ and $\dfrac{\partial\phi}{\partial y}=y$, so $\nabla\phi=(x,\,y)$ — the identical field $\mathbf F(x,y)=(x,y)$ the hook used, just now seen as a gradient.

**Step 2 — plug in $(1,1)$.** $\nabla\phi=(1,\,1)$: an arrow pointing away from the origin.

**Step 3 — plug in $(0,0)$.** $\nabla\phi=(0,0)$: no arrow at all.

**Check.** $(1,1)$ points away from the centre, and $\phi$ really does grow as you move away from $(0,0)$ — the arrow points the direction height increases, which is what "steepest ascent" means. At $(0,0)$, the bottom of the bowl, no direction is uphill, so the zero arrow is correct, not a mistake.
