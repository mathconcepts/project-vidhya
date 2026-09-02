---
id: vector-spaces.worked-example
concept_id: vector-spaces
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** Let $W = \{(x,y,z)\in\mathbb{R}^3 : x+y+z=0\}$. (a) Prove $W$ is a subspace of $\mathbb{R}^3$. (b) Find a basis for $W$ and state $\dim(W)$.

---

**Step 1 — Zero vector.** Is $(0,0,0)\in W$? $0+0+0=0$. Yes. ✓

---

**Step 2 — Closed under addition.** Let $\mathbf{u}=(x_1,y_1,z_1),\mathbf{v}=(x_2,y_2,z_2)\in W$, so $x_1+y_1+z_1=0$ and $x_2+y_2+z_2=0$. Then

$$(x_1+x_2)+(y_1+y_2)+(z_1+z_2) = (x_1+y_1+z_1)+(x_2+y_2+z_2) = 0+0=0$$

so $\mathbf{u}+\mathbf{v}\in W$. ✓

---

**Step 3 — Closed under scalar multiplication.** For $c\mathbf{u}=(cx_1,cy_1,cz_1)$: $cx_1+cy_1+cz_1=c(x_1+y_1+z_1)=c\cdot0=0$, so $c\mathbf{u}\in W$. ✓ All three tests pass: $W$ is a subspace.

---

**Step 4 — Basis.** Parameterize: set $y=s$, $z=t$ free, then $x=-s-t$.

$$\mathbf{v} = \begin{pmatrix}-s-t\\s\\t\end{pmatrix} = s\begin{pmatrix}-1\\1\\0\end{pmatrix} + t\begin{pmatrix}-1\\0\\1\end{pmatrix}$$

These two vectors are linearly independent (if $\alpha\mathbf{b}_1+\beta\mathbf{b}_2=\mathbf{0}$ then $\alpha=\beta=0$ directly from the components).

$$\boxed{\text{Basis } \{(-1,1,0),\ (-1,0,1)\},\quad \dim(W)=2}$$

**Check via rank-nullity.** $W=\text{Null}(A)$ for $A=[1\ 1\ 1]$, $\text{rank}(A)=1$, so $\dim(\text{Null}(A))=3-1=2$ — confirms the basis without extra work.

**Contrast:** $W'=\{x+y+z=1\}$ fails Test 1 immediately: $0+0+0=0\neq1$, so $W'$ is **not** a subspace — done in five seconds.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: is W = {x+y+z=0} a subspace of R³?","steps":[{"prompt":"What are the three conditions you must verify to prove W is a subspace of R^3?","hint":"Think about what a subspace must contain and what operations must keep you inside W.","answer":"(1) The zero vector (0,0,0) must be in W. (2) W must be closed under vector addition: if u, v are in W then u+v must be in W. (3) W must be closed under scalar multiplication: if u is in W and c is any real scalar, cu must be in W."},{"prompt":"Take two generic vectors u=(x1,y1,z1) and v=(x2,y2,z2) both satisfying x+y+z=0. Show their sum is also in W.","hint":"Add the two constraint equations together. What do you get?","answer":"(x1+x2)+(y1+y2)+(z1+z2) = (x1+y1+z1)+(x2+y2+z2) = 0+0 = 0. So u+v satisfies the constraint and belongs to W."},{"prompt":"What is a basis for W and what is dim(W)? Use the free-variable method.","hint":"From x+y+z=0, let y=s and z=t be free. Express x in terms of s and t, then split into two vectors.","answer":"Basis: {(-1,1,0), (-1,0,1)}. From x = -s-t: (x,y,z) = s(-1,1,0) + t(-1,0,1). These two vectors are linearly independent, so dim(W) = 2."}]}
```
