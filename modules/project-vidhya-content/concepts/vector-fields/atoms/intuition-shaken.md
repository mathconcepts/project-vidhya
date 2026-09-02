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

Take $\phi(x,y)=x^2+y^2$, height on a bowl-shaped surface.

**Step 1 — differentiate.** $\dfrac{\partial\phi}{\partial x}=2x$ and $\dfrac{\partial\phi}{\partial y}=2y$, so $\nabla\phi=(2x,\,2y)$.

**Step 2 — plug in $(1,1)$.** $\nabla\phi=(2\cdot1,\ 2\cdot1)=(2,2)$: an arrow pointing away from the origin.

**Step 3 — plug in $(0,0)$.** $\nabla\phi=(0,0)$: no arrow at all.

**Check.** $(2,2)$ points away from the centre, and $\phi$ really does grow as you move away from $(0,0)$ — the arrow points the direction height increases, which is what "steepest ascent" means. At $(0,0)$, the bottom of the bowl, no direction is uphill, so the zero arrow is correct, not a mistake.
