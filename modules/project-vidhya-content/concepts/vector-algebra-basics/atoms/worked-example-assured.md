---
# Alternative body for vector-algebra-basics.worked-example, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: vector-algebra-basics.worked_example.assured
concept_id: vector-algebra-basics
atom_type: worked_example
bloom_level: 3
difficulty: 0.30
exam_ids: ["*"]
scaffold_fade: true
variant_of: vector-algebra-basics.worked-example
for_stance: assured
---

$\vec a=(1,1,0),\vec b=(1,0,1),\vec c=(1,1,1)$: $\cos\theta=\frac{\vec a\cdot\vec b}{|\vec a||\vec b|}=\frac{1}{2}\Rightarrow\theta=60^\circ$; $\vec a\times\vec b=(1,-1,-1)$, area $\sqrt3$, cross-checked against $|\vec a||\vec b|\sin60^\circ=2\cdot\frac{\sqrt3}{2}=\sqrt3$; $[\vec a\,\vec b\,\vec c]=\vec a\cdot(\vec b\times\vec c)=-1$.

The number $-1$ answers two questions at once, and it costs marks to only read one: the magnitude, $1$, is the parallelepiped's volume and confirms non-coplanarity; the sign, negative, reports that $(\vec a,\vec b,\vec c)$ is a left-handed ordering, not a smaller or more-negative volume. Reordering to $(\vec b,\vec a,\vec c)$ flips the sign to $+1$ without changing the shape at all — a fast distractor for a which-ordering-gives-volume question.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: scalar triple product and coplanarity","steps":[{"prompt":"To test whether $\\vec{a}=(1,1,0)$, $\\vec{b}=(1,0,1)$, $\\vec{c}=(1,1,1)$ are coplanar, which single number do we need to compute?","hint":"It's the volume of the parallelepiped they form.","answer":"The scalar triple product $[\\vec{a}\\ \\vec{b}\\ \\vec{c}] = \\vec{a}\\cdot(\\vec{b}\\times\\vec{c})$."},{"prompt":"Compute $\\vec{b}\\times\\vec{c}$ first. What vector do you get?","hint":"Use the determinant formula with rows $\\hat i,\\hat j,\\hat k$ then $\\vec b$ then $\\vec c$.","answer":"$\\vec{b}\\times\\vec{c} = (-1, 0, 1)$"},{"prompt":"Now dot $\\vec{a}=(1,1,0)$ with $(-1,0,1)$. What is the scalar triple product, and are the vectors coplanar?","hint":"$\\vec a \\cdot (\\vec b \\times \\vec c) = (1)(-1)+(1)(0)+(0)(1)$.","answer":"The triple product is $-1$, which is nonzero, so the three vectors are NOT coplanar."}],"caption":"A zero scalar triple product means zero enclosed volume — the geometric signature of three vectors collapsing into a single plane."}
```
