---
id: vector-algebra-basics.interleaved_drill
concept_id: vector-algebra-basics
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.6
exam_ids: ["*"]
modality: drill
---

**Cross-concept check: vector-algebra-basics → vector-fields.**

**Question 1 (vector-algebra-basics):** Compute $\vec a\cdot\hat u$ for the constant vector $\vec a=(2,4)$ and the unit vector $\hat u=\left(\tfrac1{\sqrt2},\tfrac1{\sqrt2}\right)$.

*Answer:* $\vec a\cdot\hat u=2\cdot\tfrac1{\sqrt2}+4\cdot\tfrac1{\sqrt2}=\tfrac6{\sqrt2}=3\sqrt2\approx4.24$ — the ordinary dot product between two fixed vectors, nothing about a field yet.

**Question 2 (vector-fields):** For $\phi(x,y)=x^2+y^2$, its gradient at $(1,2)$ is $\nabla\phi=(2,4)$ — the same vector as $\vec a$ above. What is the directional derivative of $\phi$ at $(1,2)$ in direction $\hat u$?

*Answer:* $D_{\hat u}\phi=\nabla\phi\cdot\hat u=3\sqrt2$ — the identical dot-product computation from Question 1, run again with no new formula.

**Why this drill exists:** students meet "directional derivative" in vector-fields as though it were a brand-new rule and try to memorize it separately, when it is exactly the vector-algebra-basics dot product applied to one particular vector — the gradient, evaluated at a point — and a unit direction. Does the dot product still make sense once one side of it comes from a field instead of being handed to you as fixed numbers? Yes, unchanged; only the *source* of the vector changed.
