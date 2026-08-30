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
id: vector-algebra-basics.worked_example.shaken
concept_id: vector-algebra-basics
atom_type: worked_example
bloom_level: 3
difficulty: 0.30
exam_ids: ["*"]
scaffold_fade: true
variant_of: vector-algebra-basics.worked-example
for_stance: shaken
---

$\vec a=(1,1,0),\ \vec b=(1,0,1),\ \vec c=(1,1,1)$.

Angle between $\vec a,\vec b$: $\vec a\cdot\vec b=(1)(1)+(1)(0)+(0)(1)=1$. $|\vec a|=\sqrt2,\ |\vec b|=\sqrt2$. $\cos\theta=\frac{1}{2}$, so $\theta=60^\circ$.

Cross product: $\vec a\times\vec b=\hat i(1\cdot1-0\cdot0)-\hat j(1\cdot1-0\cdot1)+\hat k(1\cdot0-1\cdot1)=(1,-1,-1)$. Its length is $\sqrt{1+1+1}=\sqrt3$, the area of the parallelogram the two vectors span.

Triple product: first $\vec b\times\vec c=(1,0,1)\times(1,1,1)=(0\cdot1-1\cdot1,\ 1\cdot1-1\cdot1,\ 1\cdot1-0\cdot1)=(-1,0,1)$. Then $\vec a\cdot(\vec b\times\vec c)=(1)(-1)+(1)(0)+(0)(1)=-1$.

Since $-1\ne0$, the parallelepiped they form has nonzero volume, $1$ cubic unit, so $\vec a,\vec b,\vec c$ are not coplanar.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: scalar triple product and coplanarity","steps":[{"prompt":"To test whether $\\vec{a}=(1,1,0)$, $\\vec{b}=(1,0,1)$, $\\vec{c}=(1,1,1)$ are coplanar, which single number do we need to compute?","hint":"It's the volume of the parallelepiped they form.","answer":"The scalar triple product $[\\vec{a}\\ \\vec{b}\\ \\vec{c}] = \\vec{a}\\cdot(\\vec{b}\\times\\vec{c})$."},{"prompt":"Compute $\\vec{b}\\times\\vec{c}$ first. What vector do you get?","hint":"Use the determinant formula with rows $\\hat i,\\hat j,\\hat k$ then $\\vec b$ then $\\vec c$.","answer":"$\\vec{b}\\times\\vec{c} = (-1, 0, 1)$"},{"prompt":"Now dot $\\vec{a}=(1,1,0)$ with $(-1,0,1)$. What is the scalar triple product, and are the vectors coplanar?","hint":"$\\vec a \\cdot (\\vec b \\times \\vec c) = (1)(-1)+(1)(0)+(0)(1)$.","answer":"The triple product is $-1$, which is nonzero, so the three vectors are NOT coplanar."}],"caption":"A zero scalar triple product means zero enclosed volume — the geometric signature of three vectors collapsing into a single plane."}
```
