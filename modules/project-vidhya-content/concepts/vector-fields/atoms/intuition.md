---
id: vector-fields.intuition
concept_id: vector-fields
atom_type: intuition
bloom_level: 2
difficulty: 0.10
exam_ids: ["*"]
modality: visual
---

Picture a landscape's height as a **scalar field** $\phi(x,y)$ — one number per point, no direction. Now stand at a point and ask: which way is uphill, and how steep is it right here? Both answers together — a direction and a magnitude — make a vector, and doing this at every point produces a **vector field**, $\nabla\phi$, built out of the scalar field underneath it.

Take $\phi(x,y) = x^2+y^2$, a bowl with its bottom at the origin. The gradient is $\nabla\phi=(2x,2y)$. At $(1,1)$: $\nabla\phi=(2,2)$, an arrow pointing away from the origin — exactly the uphill direction on this bowl, since height only increases as you move outward. At $(0,0)$, the bottom, $\nabla\phi=(0,0)$: flat ground, no uphill direction at all.

Not every vector field arises this way. A field like $(-y,x)$, which circles rather than radiates, is not the gradient of any scalar height map — there is no hill whose steepest-ascent directions spiral. Gradient fields are the special, well-behaved case; general vector fields need not come from a scalar at all.
