---
# Alternative body for vector-fields.intuition, served when the learner
# stance is `assured`.
id: vector-fields.intuition.assured
concept_id: vector-fields
atom_type: intuition
bloom_level: 2
difficulty: 0.10
exam_ids: ["*"]
modality: visual
variant_of: vector-fields.intuition
for_stance: assured
---

$\nabla\phi$ points **perpendicular** to the level curve through that point, never tangent to it — the tangent direction is exactly where $\phi$ does not change, the opposite of steepest ascent.

For $\phi=x^2+y^2$, the level curves are circles $x^2+y^2=c$. At $(1,1)$ the circle's tangent runs in the $(-1,1)$ direction, while $\nabla\phi=(2,2)$ points radially outward — orthogonal to it, not along it. Reaching for the tangent direction when a question asks for the gradient is a $90°$ error, and it is the more tempting mistake precisely because both directions are "natural" ones to read off the same picture.

The zero vector matters too: $\nabla\phi=0$ marks a critical point of $\phi$, not an error in the computation — at $(0,0)$ here, that is correctly the bowl's minimum, where every direction is equally (non-)uphill.
