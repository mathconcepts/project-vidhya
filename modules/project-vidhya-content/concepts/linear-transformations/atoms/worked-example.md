---
id: linear-transformations.worked_example
concept_id: linear-transformations
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
---

# Worked Example: Finding Kernel and Image

## Problem

Consider the linear transformation $T: \mathbb{R}^3 \to \mathbb{R}^2$ defined by:
$$T(x, y, z) = (x + y, y + z)$$

**(a)** Find a basis for $\text{Ker}(T)$ (the kernel).
**(b)** Find a basis for $\text{Im}(T)$ (the image).
**(c)** Verify the rank-nullity theorem: $\dim(\mathbb{R}^3) = \text{rank}(T) + \text{nullity}(T)$.

---

## Solution

### Part (a): Finding Ker(T)

The kernel is the set of vectors $(x, y, z)$ such that $T(x, y, z) = (0, 0)$.

$$\begin{cases} x + y = 0 \\ y + z = 0 \end{cases}$$

From the first equation: $x = -y$  
From the second equation: $z = -y$

Let $y = t$ (free parameter). Then $(x, y, z) = (-t, t, -t) = t(-1, 1, -1)$.

**Basis for Ker(T):** $\boxed{\{(-1, 1, -1)\}}$

**Nullity** (dimension of kernel) $= 1$

### Part (b): Finding Im(T)

The image is the set of all possible outputs $T(x, y, z) = (x + y, y + z)$.

Set $(u, v) = (x + y, y + z)$. We can rewrite this as:
$$\begin{pmatrix} u \\ v \end{pmatrix} = x\begin{pmatrix} 1 \\ 0 \end{pmatrix} + y\begin{pmatrix} 1 \\ 1 \end{pmatrix} + z\begin{pmatrix} 0 \\ 1 \end{pmatrix}$$

So the image is spanned by $\{(1, 0), (1, 1), (0, 1)\}$. These three vectors lie in $\mathbb{R}^2$, so at most 2 are linearly independent.

Check: $(1, 0)$ and $(1, 1)$ are linearly independent (they're not scalar multiples). Also, $(0, 1) = (1, 1) - (1, 0)$, so it's in their span.

**Basis for Im(T):** $\boxed{\{(1, 0), (1, 1)\}}$

**Rank** (dimension of image) $= 2$

### Part (c): Verify Rank-Nullity Theorem

$$\dim(\text{domain}) = \text{rank} + \text{nullity}$$
$$3 = 2 + 1 \, \checkmark$$

---

## Interactive Walkthrough

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Finding Ker(T) and Im(T)","steps":[{"prompt":"Step 1: To find Ker(T), set the outputs equal to zero. What equations do you need to solve?","hint":"The transformation gives $(x+y, y+z)$. Setting this to $(0, 0)$ yields two equations.","answer":"$x + y = 0$ and $y + z = 0$"},{"prompt":"Step 2: Solve for the free variable. If $y = t$, what are $x$ and $z$ in terms of $t$?","hint":"From the first equation, $x = -y = -t$. From the second, $z = -y = -t$.","answer":"$x = -t$, $z = -t$. Kernel vectors are $t(-1, 1, -1)$, giving basis $\\{(-1, 1, -1)\\}$."},{"prompt":"Step 3: For the image, express $(x+y, y+z)$ as a linear combination. Which vectors form a basis?","hint":"Write $(x+y, y+z) = x(1, 0) + y(1, 1) + z(0, 1)$. Check if all three span vectors are independent in $\\mathbb{R}^2$.","answer":"Any two of the three vectors are independent; the third is in their span. Basis: $\\{(1, 0), (1, 1)\\}$ or $\\{(1, 0), (0, 1)\\}$."},{"prompt":"Step 4: Check rank-nullity. We have nullity = 1 (Ker dimension) and rank = 2 (Im dimension). Does $1 + 2 = 3 = \\dim(\\mathbb{R}^3)$?","hint":"The rank-nullity theorem states: dimension of domain = rank + nullity.","answer":"Yes, $3 = 2 + 1$. The theorem is verified."}],"caption":"Key exam insight: Kernel finds what vanishes; image finds what can be reached. Rank-nullity is your algebra sanity check."}
```
