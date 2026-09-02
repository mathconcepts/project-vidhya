---
# Alternative body for vector-spaces.worked-example, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence.
# The scaffolding is REAL but it is not on the page: prose is held at or below
# the base atom's length, because a screen that is visibly longer than the one
# that already defeated this reader signals difficulty no matter how kindly it
# is written. The extra steps live in the walkthrough below, where they unfold
# one at a time when the student asks for them.
#
# The walkthrough may carry MORE steps than the base's, but every answer the
# base asserts survives here in order and the final answer is identical —
# scripts/check-variant-agreement.ts enforces that. Prompts and hints are the
# part that may differ, and they are where the gentler register lives.
#
# The fenced interactive block below is copied verbatim from the base
# atom so the widget cannot drift between variants; only prose differs.
id: vector-spaces.worked-example.shaken
concept_id: vector-spaces
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
variant_of: vector-spaces.worked-example
for_stance: shaken
---

**Problem:** $W = \{(x,y,z)\in\mathbb{R}^3 : x+y+z=0\}$. (a) Show $W$ is a subspace. (b) Find a basis and $\dim(W)$.

---

**Zero vector.** Is $(0,0,0)\in W$? $0+0+0=0$. Yes.

---

**Closed under addition.** Take $\mathbf{u}=(x_1,y_1,z_1)$ and $\mathbf{v}=(x_2,y_2,z_2)$, both in $W$: $x_1+y_1+z_1=0$ and $x_2+y_2+z_2=0$.

$$(x_1+x_2)+(y_1+y_2)+(z_1+z_2) = 0+0 = 0$$

So $\mathbf{u}+\mathbf{v}\in W$.

---

**Closed under scaling.** For $c\mathbf{u}=(cx_1,cy_1,cz_1)$: $cx_1+cy_1+cz_1=c(0)=0$. So $c\mathbf{u}\in W$. All three pass — $W$ is a subspace.

---

**Finding a basis.** Set $y=s$, $z=t$ free. Then $x=-s-t$:

$$\begin{pmatrix}x\\y\\z\end{pmatrix} = s\begin{pmatrix}-1\\1\\0\end{pmatrix} + t\begin{pmatrix}-1\\0\\1\end{pmatrix}$$

These two vectors span $W$, and they're not multiples of each other, so they're independent.

$$\boxed{\text{Basis } \{(-1,1,0),(-1,0,1)\},\ \dim(W)=2}$$

**Check with Rank-Nullity.** $W = \text{Null}(A)$ for $A=[1\ 1\ 1]$. $\text{rank}(A)=1$, so $\dim(\text{Null}(A)) = 3-1 = 2$ — same answer, no basis needed.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: is W = {x+y+z=0} a subspace of R³?","steps":[{"prompt":"Name the three things you have to check to prove W is a subspace.","hint":"One is about the zero vector; the other two are about staying inside W after an operation.","answer":"(1) The zero vector (0,0,0) must be in W. (2) W must be closed under vector addition: if u, v are in W then u+v must be in W. (3) W must be closed under scalar multiplication: if u is in W and c is any real scalar, cu must be in W."},{"prompt":"Take u=(x1,y1,z1) and v=(x2,y2,z2), both satisfying x+y+z=0. Add the two constraint equations together. What does that tell you about u+v?","hint":"You're not plugging in numbers — just adding the two zero-equations component by component.","answer":"(x1+x2)+(y1+y2)+(z1+z2) = (x1+y1+z1)+(x2+y2+z2) = 0+0 = 0. So u+v satisfies the constraint and belongs to W."},{"prompt":"From x+y+z=0, let y=s and z=t be free. Write x in terms of s and t, then split the vector into two pieces — one scaled by s, one by t.","hint":"x = -s-t. Group the s-terms into one vector and the t-terms into another.","answer":"Basis: {(-1,1,0), (-1,0,1)}. From x = -s-t: (x,y,z) = s(-1,1,0) + t(-1,0,1). These two vectors are linearly independent, so dim(W) = 2."}]}
```
