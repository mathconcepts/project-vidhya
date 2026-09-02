---
# Alternative body for vector-algebra-basics.worked-example, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
#
# The fenced interactive block below is copied verbatim from the base
# atom so the widget cannot drift between variants; only prose differs.
id: vector-algebra-basics.worked-example.shaken
concept_id: vector-algebra-basics
atom_type: worked_example
bloom_level: 3
difficulty: 0.20
exam_ids: ["*"]
scaffold_fade: true
variant_of: vector-algebra-basics.worked-example
for_stance: shaken
---

**Problem:** Area of the parallelogram from $\vec a=(2,1,-1)$, $\vec b=(1,-1,2)$; volume with $\vec c=(1,2,2)$.

---

**Step 1 — Cross product, one entry at a time.** $\hat\imath$: $(1)(2)-(-1)(-1)=2-1=1$. $\hat\jmath$: $-[(2)(2)-(-1)(1)]=-(4+1)=-5$. $\hat k$: $(2)(-1)-(1)(1)=-2-1=-3$. So $\vec a\times\vec b=(1,-5,-3)$.

---

**Step 2 — Length of that vector.** $\sqrt{1^2+5^2+3^2}=\sqrt{1+25+9}=\sqrt{35}\approx5.92$.

$$\boxed{\text{Area}=\sqrt{35}}$$

---

**Step 3 — Dot with $\vec c$.** $(1)(1)+(-5)(2)+(-3)(2)=1-10-6=-15$.

---

**Step 4 — Take the absolute value for volume.**

$$\boxed{V=15}$$

**Check:** redo Step 3's arithmetic in reverse order: $-6-10+1=-15$ — same total, so no entry or sign was dropped.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: picking the right vector product","steps":[{"prompt":"The question asks for the angle between two vectors. Which product do you reach for?","hint":"One product returns a scalar tied to cosine; the other returns a vector tied to sine.","answer":"The dot product: $\\cos\\theta=\\dfrac{\\vec a\\cdot\\vec b}{|\\vec a||\\vec b|}$."},{"prompt":"The question asks for a vector perpendicular to two given vectors. Which product?","hint":"You need a vector back, not a number.","answer":"The cross product $\\vec a\\times\\vec b$ — perpendicular to both, direction from the right-hand rule."},{"prompt":"The question asks whether three vectors lie in one plane. Which product?","hint":"Coplanarity is a volume-zero statement about all three vectors at once.","answer":"The scalar triple product $\\vec a\\cdot(\\vec b\\times\\vec c)$ — zero exactly when the three are coplanar."}],"caption":"Angle or projection -> dot product. Perpendicular direction or area -> cross product. Coplanarity or volume -> scalar triple product."}
```
