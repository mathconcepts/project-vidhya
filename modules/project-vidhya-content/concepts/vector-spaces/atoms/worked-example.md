---
id: vector-spaces-worked-example
concept_id: vector-spaces
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
---

# Worked Example: Is W a Subspace of $\mathbb{R}^3$?

**Problem (GATE-style):** Let $W = \{(x, y, z) \in \mathbb{R}^3 : x + y + z = 0\}$.

**(a)** Prove that $W$ is a subspace of $\mathbb{R}^3$.  
**(b)** Find a basis for $W$ and state $\dim(W)$.

---

## Part (a) — Subspace Verification

Apply the **three subspace tests**.

### Test 1 — Zero Vector

Is $(0, 0, 0) \in W$? Check: $0 + 0 + 0 = 0$. **Yes.** ✓

### Test 2 — Closure Under Addition

Let $\mathbf{u} = (x_1, y_1, z_1) \in W$ and $\mathbf{v} = (x_2, y_2, z_2) \in W$.

By assumption: $x_1 + y_1 + z_1 = 0$ and $x_2 + y_2 + z_2 = 0$.

Check $\mathbf{u} + \mathbf{v} = (x_1+x_2,\ y_1+y_2,\ z_1+z_2)$:

$$(x_1+x_2) + (y_1+y_2) + (z_1+z_2) = (x_1+y_1+z_1) + (x_2+y_2+z_2) = 0 + 0 = 0$$

So $\mathbf{u} + \mathbf{v} \in W$. **Closed under addition.** ✓

### Test 3 — Closure Under Scalar Multiplication

Let $\mathbf{u} = (x_1, y_1, z_1) \in W$ and $c \in \mathbb{R}$.

Check $c\mathbf{u} = (cx_1, cy_1, cz_1)$:

$$cx_1 + cy_1 + cz_1 = c(x_1 + y_1 + z_1) = c \cdot 0 = 0$$

So $c\mathbf{u} \in W$. **Closed under scalar multiplication.** ✓

**Conclusion:** All three tests pass, so $W$ is a subspace of $\mathbb{R}^3$.

---

## Part (b) — Finding a Basis

**Parameterize the constraint** $x + y + z = 0$:

Set $y = s$ and $z = t$ (free variables), then $x = -s - t$.

$$\mathbf{v} = \begin{pmatrix} -s-t \\ s \\ t \end{pmatrix} = s\begin{pmatrix} -1 \\ 1 \\ 0 \end{pmatrix} + t\begin{pmatrix} -1 \\ 0 \\ 1 \end{pmatrix}$$

Every vector in $W$ is a linear combination of:

$$\mathbf{b}_1 = (-1, 1, 0) \qquad \mathbf{b}_2 = (-1, 0, 1)$$

**Are they linearly independent?** Suppose $\alpha\mathbf{b}_1 + \beta\mathbf{b}_2 = \mathbf{0}$:

$$(-\alpha - \beta,\ \alpha,\ \beta) = (0, 0, 0) \implies \alpha = 0,\ \beta = 0. \checkmark$$

**A basis for $W$ is $\{(-1, 1, 0),\ (-1, 0, 1)\}$, and $\dim(W) = 2$.**

---

## Sanity Check via Rank-Nullity

$W$ is the **null space** of the $1 \times 3$ matrix $A = [1\ 1\ 1]$ (the single equation $x+y+z=0$).

$$\text{rank}(A) = 1 \quad\Rightarrow\quad \dim(\text{Null}(A)) = n - \text{rank}(A) = 3 - 1 = 2$$

This confirms $\dim(W) = 2$ without computing the basis explicitly. In an MCQ, Rank-Nullity gives the dimension in one line.

---

## GATE Variant — When W Is NOT a Subspace

Consider $W' = \{(x, y, z) : x + y + z = 1\}$.

Test 1: Is $(0,0,0) \in W'$? $0 + 0 + 0 = 0 \neq 1$. **Fail.** $W'$ is **not** a subspace. Done in 5 seconds.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","steps":[{"prompt":"What are the three conditions you must verify to prove W is a subspace of R^3?","hint":"Think about what a subspace must contain and what operations must keep you inside W.","answer":"(1) The zero vector (0,0,0) must be in W. (2) W must be closed under vector addition: if u, v are in W then u+v must be in W. (3) W must be closed under scalar multiplication: if u is in W and c is any real scalar, cu must be in W."},{"prompt":"Take two generic vectors u=(x1,y1,z1) and v=(x2,y2,z2) both satisfying x+y+z=0. Show their sum is also in W.","hint":"Add the two constraint equations together. What do you get?","answer":"(x1+x2)+(y1+y2)+(z1+z2) = (x1+y1+z1)+(x2+y2+z2) = 0+0 = 0. So u+v satisfies the constraint and belongs to W."},{"prompt":"What is a basis for W and what is dim(W)? Use the free-variable method.","hint":"From x+y+z=0, let y=s and z=t be free. Express x in terms of s and t, then split into two vectors.","answer":"Basis: {(-1,1,0), (-1,0,1)}. From x = -s-t: (x,y,z) = s(-1,1,0) + t(-1,0,1). These two vectors are linearly independent, so dim(W) = 2."}]}
```
