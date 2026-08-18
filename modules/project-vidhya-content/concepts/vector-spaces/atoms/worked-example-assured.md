---
# Alternative body for vector-spaces-worked-example, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
#
# variant_of names the base's literal (unusually hyphenated, not dotted) id
# field — see the concept's atoms/worked-example.md front matter.
id: vector-spaces.worked-example.assured
concept_id: vector-spaces
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: vector-spaces-worked-example
for_stance: assured
---

**Problem:** $W=\{(x,y,z)\in\mathbb{R}^3 : x+y+z=0\}$ — subspace? Basis? $\dim(W)$?

**Recognize the shape first.** $W$ is the solution set of one homogeneous linear equation — that alone makes it a subspace ($\text{Null}(A)$ for $A=[1\ 1\ 1]$ is automatically closed under $+$ and scalar $\cdot$, with $\mathbf{0}$ always satisfying a homogeneous system). Full axiom-checking is defensible but not the fast route.

**Dimension by Rank-Nullity, no basis required:** $\text{rank}(A)=1 \Rightarrow \dim(\text{Null}(A)) = 3-1=2$.

**Basis, if the question asks for one explicitly.** Parameterize $y=s,\,z=t$:

$$\begin{pmatrix}x\\y\\z\end{pmatrix} = s\begin{pmatrix}-1\\1\\0\end{pmatrix} + t\begin{pmatrix}-1\\0\\1\end{pmatrix}$$

$$\boxed{\text{Basis } \{(-1,1,0),(-1,0,1)\},\ \dim(W)=2}$$

**Where this breaks.** $W'=\{x+y+z=1\}$ fails at $\mathbf{0}$ in one line — *inhomogeneous* linear equations never define a subspace, since the zero vector can't satisfy a nonzero right-hand side. Recognizing homogeneous vs. inhomogeneous on sight saves the whole three-test writeup.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: is W = {x+y+z=0} a subspace of R³?","steps":[{"prompt":"What are the three conditions you must verify to prove W is a subspace of R^3?","hint":"Think about what a subspace must contain and what operations must keep you inside W.","answer":"(1) The zero vector (0,0,0) must be in W. (2) W must be closed under vector addition: if u, v are in W then u+v must be in W. (3) W must be closed under scalar multiplication: if u is in W and c is any real scalar, cu must be in W."},{"prompt":"Take two generic vectors u=(x1,y1,z1) and v=(x2,y2,z2) both satisfying x+y+z=0. Show their sum is also in W.","hint":"Add the two constraint equations together. What do you get?","answer":"(x1+x2)+(y1+y2)+(z1+z2) = (x1+y1+z1)+(x2+y2+z2) = 0+0 = 0. So u+v satisfies the constraint and belongs to W."},{"prompt":"What is a basis for W and what is dim(W)? Use the free-variable method.","hint":"From x+y+z=0, let y=s and z=t be free. Express x in terms of s and t, then split into two vectors.","answer":"Basis: {(-1,1,0), (-1,0,1)}. From x = -s-t: (x,y,z) = s(-1,1,0) + t(-1,0,1). These two vectors are linearly independent, so dim(W) = 2."}]}
```
