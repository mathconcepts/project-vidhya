---
# Alternative body for vector-algebra-basics.worked-example, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
#
# The fenced interactive block below is copied verbatim from the base
# atom so the widget cannot drift between variants; only prose differs.
id: vector-algebra-basics.worked-example.assured
concept_id: vector-algebra-basics
atom_type: worked_example
bloom_level: 3
difficulty: 0.20
exam_ids: ["*"]
scaffold_fade: true
variant_of: vector-algebra-basics.worked-example
for_stance: assured
---

**Problem:** Same $\vec a,\vec b,\vec c$ — area and volume, by determinant shortcut.

$$[\vec a\ \vec b\ \vec c]=\det\begin{pmatrix}2&1&-1\\1&-1&2\\1&2&2\end{pmatrix}=2\begin{vmatrix}-1&2\\2&2\end{vmatrix}-1\begin{vmatrix}1&2\\1&2\end{vmatrix}+(-1)\begin{vmatrix}1&-1\\1&2\end{vmatrix}=2(-6)-1(0)-1(3)=-15$$

$$\boxed{V=15}$$

For the area, $\vec a\times\vec b=(1,-5,-3)$ (Step 1 of the base example), so $\boxed{\text{Area}=\sqrt{35}}$.

**The distinction worth marks:** the scalar triple product **is** a $3\times3$ determinant of the three vectors as rows — once you know determinants, go straight there instead of computing $\vec b\times\vec c$ and then dotting with $\vec a$. But the **cross product itself has no such determinant-to-a-number shortcut** — its output is a vector, not a scalar, so there is no faster route around Steps 1–2 of the area computation.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: picking the right vector product","steps":[{"prompt":"The question asks for the angle between two vectors. Which product do you reach for?","hint":"One product returns a scalar tied to cosine; the other returns a vector tied to sine.","answer":"The dot product: $\\cos\\theta=\\dfrac{\\vec a\\cdot\\vec b}{|\\vec a||\\vec b|}$."},{"prompt":"The question asks for a vector perpendicular to two given vectors. Which product?","hint":"You need a vector back, not a number.","answer":"The cross product $\\vec a\\times\\vec b$ — perpendicular to both, direction from the right-hand rule."},{"prompt":"The question asks whether three vectors lie in one plane. Which product?","hint":"Coplanarity is a volume-zero statement about all three vectors at once.","answer":"The scalar triple product $\\vec a\\cdot(\\vec b\\times\\vec c)$ — zero exactly when the three are coplanar."}],"caption":"Angle or projection -> dot product. Perpendicular direction or area -> cross product. Coplanarity or volume -> scalar triple product."}
```
