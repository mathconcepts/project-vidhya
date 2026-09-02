---
id: vector-algebra-basics.worked-example
concept_id: vector-algebra-basics
atom_type: worked_example
bloom_level: 3
difficulty: 0.20
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** Find (a) the area of the parallelogram spanned by $\vec a=(2,1,-1)$ and $\vec b=(1,-1,2)$, and (b) the volume of the parallelepiped formed by $\vec a,\vec b,\vec c=(1,2,2)$.

---

**Step 1 — Compute $\vec a\times\vec b$.**

$$\vec a\times\vec b=\begin{vmatrix}\hat\imath&\hat\jmath&\hat k\\2&1&-1\\1&-1&2\end{vmatrix}=\hat\imath\big[(1)(2)-(-1)(-1)\big]-\hat\jmath\big[(2)(2)-(-1)(1)\big]+\hat k\big[(2)(-1)-(1)(1)\big]$$

$$=\hat\imath(2-1)-\hat\jmath(4+1)+\hat k(-2-1)=(1,-5,-3)$$

---

**Step 2 — Area from the cross product's magnitude.** $|\vec a\times\vec b|=\sqrt{1^2+(-5)^2+(-3)^2}=\sqrt{1+25+9}=\sqrt{35}\approx5.92$.

$$\boxed{\text{Area}=\sqrt{35}\approx5.92}$$

---

**Step 3 — Volume via the scalar triple product.** Reuse $\vec a\times\vec b=(1,-5,-3)$ from Step 1 — no need to recompute it. $[\vec a\ \vec b\ \vec c]=(\vec a\times\vec b)\cdot\vec c=(1)(1)+(-5)(2)+(-3)(2)=1-10-6=-15$.

---

**Step 4 — Volume is the absolute value.**

$$\boxed{V=|-15|=15}$$

**Check:** the sign of the triple product ($-15$, negative) says $\vec a,\vec b,\vec c$ form a left-handed set — swapping any two of them would flip the sign to $+15$ without changing the volume. Since $[\vec a\ \vec b\ \vec c]\neq0$, the three vectors are not coplanar, consistent with a nonzero volume.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: picking the right vector product","steps":[{"prompt":"The question asks for the angle between two vectors. Which product do you reach for?","hint":"One product returns a scalar tied to cosine; the other returns a vector tied to sine.","answer":"The dot product: $\\cos\\theta=\\dfrac{\\vec a\\cdot\\vec b}{|\\vec a||\\vec b|}$."},{"prompt":"The question asks for a vector perpendicular to two given vectors. Which product?","hint":"You need a vector back, not a number.","answer":"The cross product $\\vec a\\times\\vec b$ — perpendicular to both, direction from the right-hand rule."},{"prompt":"The question asks whether three vectors lie in one plane. Which product?","hint":"Coplanarity is a volume-zero statement about all three vectors at once.","answer":"The scalar triple product $\\vec a\\cdot(\\vec b\\times\\vec c)$ — zero exactly when the three are coplanar."}],"caption":"Angle or projection -> dot product. Perpendicular direction or area -> cross product. Coplanarity or volume -> scalar triple product."}
```
