---
id: orthogonality-worked-example
concept_id: orthogonality
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
---

# Worked Example: Gram-Schmidt on $\{(1,1,0),\,(1,0,1),\,(0,1,1)\}$

A classic GATE problem type: apply Gram-Schmidt to three vectors in $\mathbb{R}^3$ and produce an orthonormal basis.

Let $\mathbf{v}_1 = (1,1,0)$, $\mathbf{v}_2 = (1,0,1)$, $\mathbf{v}_3 = (0,1,1)$.

---

## Step 1: First Orthonormal Vector $\mathbf{q}_1$

Set $\mathbf{u}_1 = \mathbf{v}_1 = (1, 1, 0)$.

$$\|\mathbf{u}_1\| = \sqrt{1^2 + 1^2 + 0^2} = \sqrt{2}$$

$$\mathbf{q}_1 = \frac{\mathbf{u}_1}{\|\mathbf{u}_1\|} = \left(\frac{1}{\sqrt{2}},\, \frac{1}{\sqrt{2}},\, 0\right)$$

---

## Step 2: Second Orthonormal Vector $\mathbf{q}_2$

Subtract the projection of $\mathbf{v}_2$ onto $\mathbf{q}_1$:

$$\mathbf{v}_2 \cdot \mathbf{q}_1 = (1)\tfrac{1}{\sqrt{2}} + (0)\tfrac{1}{\sqrt{2}} + (1)(0) = \frac{1}{\sqrt{2}}$$

$$\mathbf{u}_2 = \mathbf{v}_2 - (\mathbf{v}_2 \cdot \mathbf{q}_1)\mathbf{q}_1 = (1,0,1) - \frac{1}{\sqrt{2}}\left(\frac{1}{\sqrt{2}},\frac{1}{\sqrt{2}},0\right)$$

$$= (1,0,1) - \left(\frac{1}{2}, \frac{1}{2}, 0\right) = \left(\frac{1}{2}, -\frac{1}{2}, 1\right)$$

$$\|\mathbf{u}_2\| = \sqrt{\tfrac{1}{4} + \tfrac{1}{4} + 1} = \sqrt{\tfrac{3}{2}} = \frac{\sqrt{6}}{2}$$

$$\mathbf{q}_2 = \frac{\mathbf{u}_2}{\|\mathbf{u}_2\|} = \frac{2}{\sqrt{6}}\left(\frac{1}{2}, -\frac{1}{2}, 1\right) = \left(\frac{1}{\sqrt{6}},\, -\frac{1}{\sqrt{6}},\, \frac{2}{\sqrt{6}}\right)$$

**Check:** $\mathbf{q}_1 \cdot \mathbf{q}_2 = \frac{1}{\sqrt{2}}\cdot\frac{1}{\sqrt{6}} + \frac{1}{\sqrt{2}}\cdot\frac{-1}{\sqrt{6}} + 0 = \frac{1}{\sqrt{12}} - \frac{1}{\sqrt{12}} = 0$ ✓

---

## Step 3: Third Orthonormal Vector $\mathbf{q}_3$

Subtract projections of $\mathbf{v}_3 = (0,1,1)$ onto both $\mathbf{q}_1$ and $\mathbf{q}_2$:

$$\mathbf{v}_3 \cdot \mathbf{q}_1 = 0\cdot\tfrac{1}{\sqrt{2}} + 1\cdot\tfrac{1}{\sqrt{2}} + 1\cdot 0 = \frac{1}{\sqrt{2}}$$

$$\mathbf{v}_3 \cdot \mathbf{q}_2 = 0\cdot\tfrac{1}{\sqrt{6}} + 1\cdot\tfrac{-1}{\sqrt{6}} + 1\cdot\tfrac{2}{\sqrt{6}} = \frac{1}{\sqrt{6}}$$

$$\mathbf{u}_3 = \mathbf{v}_3 - (\mathbf{v}_3\cdot\mathbf{q}_1)\mathbf{q}_1 - (\mathbf{v}_3\cdot\mathbf{q}_2)\mathbf{q}_2$$

$$= (0,1,1) - \frac{1}{\sqrt{2}}\cdot\frac{1}{\sqrt{2}}(1,1,0) - \frac{1}{\sqrt{6}}\cdot\frac{1}{\sqrt{6}}(1,-1,2)$$

$$= (0,1,1) - \tfrac{1}{2}(1,1,0) - \tfrac{1}{6}(1,-1,2)$$

$$= (0,1,1) - \left(\tfrac{1}{2},\tfrac{1}{2},0\right) - \left(\tfrac{1}{6},-\tfrac{1}{6},\tfrac{1}{3}\right)$$

$$= \left(-\tfrac{2}{3},\, \tfrac{2}{3},\, \tfrac{2}{3}\right)$$

$$\|\mathbf{u}_3\| = \sqrt{\tfrac{4}{9}+\tfrac{4}{9}+\tfrac{4}{9}} = \frac{2\sqrt{3}}{3} = \frac{2}{\sqrt{3}}$$

$$\mathbf{q}_3 = \frac{\sqrt{3}}{2}\cdot\left(-\tfrac{2}{3},\tfrac{2}{3},\tfrac{2}{3}\right) = \left(-\tfrac{1}{\sqrt{3}},\, \tfrac{1}{\sqrt{3}},\, \tfrac{1}{\sqrt{3}}\right)$$

---

## Result: Orthonormal Basis

$$\boxed{\mathbf{q}_1 = \tfrac{1}{\sqrt{2}}(1,1,0), \quad \mathbf{q}_2 = \tfrac{1}{\sqrt{6}}(1,-1,2), \quad \mathbf{q}_3 = \tfrac{1}{\sqrt{3}}(-1,1,1)}$$

**Sanity check:** $\|\mathbf{q}_3\|^2 = \frac{1}{3}(1+1+1) = 1$ ✓, and all three pairwise dot products equal 0.

---

## Bonus: Verify an Orthogonal Matrix

Is $A = \begin{pmatrix} 1/\sqrt{2} & -1/\sqrt{2} \\ 1/\sqrt{2} & 1/\sqrt{2} \end{pmatrix}$ orthogonal?

$$A^T A = \begin{pmatrix} 1/\sqrt{2} & 1/\sqrt{2} \\ -1/\sqrt{2} & 1/\sqrt{2} \end{pmatrix}\begin{pmatrix} 1/\sqrt{2} & -1/\sqrt{2} \\ 1/\sqrt{2} & 1/\sqrt{2} \end{pmatrix} = \begin{pmatrix} 1 & 0 \\ 0 & 1 \end{pmatrix} = I$$

Yes. $\det(A) = \frac{1}{2}+\frac{1}{2} = 1 > 0$, so it represents a rotation by $45°$.

---

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Gram-Schmidt on {(1,1,0),(1,0,1),(0,1,1)}","steps":[{"prompt":"After setting $\\\\mathbf{q}_1 = \\\\frac{1}{\\\\sqrt{2}}(1,1,0)$, what must you subtract from $\\\\mathbf{v}_2 = (1,0,1)$ before normalizing to get $\\\\mathbf{q}_2$?","hint":"Compute the scalar $c = \\\\mathbf{v}_2 \\\\cdot \\\\mathbf{q}_1$, then subtract $c\\\\,\\\\mathbf{q}_1$ from $\\\\mathbf{v}_2$.","answer":"$c = \\\\frac{1}{\\\\sqrt{2}}$, so subtract $\\\\frac{1}{\\\\sqrt{2}}\\\\cdot\\\\frac{1}{\\\\sqrt{2}}(1,1,0) = \\\\frac{1}{2}(1,1,0)$. This gives $\\\\mathbf{u}_2 = (\\\\frac{1}{2}, -\\\\frac{1}{2}, 1)$."},{"prompt":"How do you verify that two vectors $\\\\mathbf{q}_i$ and $\\\\mathbf{q}_j$ produced by Gram-Schmidt are truly orthonormal?","hint":"Check both conditions: zero dot product (orthogonal) and unit length (normal).","answer":"Compute $\\\\mathbf{q}_i \\\\cdot \\\\mathbf{q}_j$: must equal 0 for $i \\\\neq j$ and 1 for $i = j$. Equivalently, form the matrix $Q = [\\\\mathbf{q}_1\\\\;\\\\mathbf{q}_2\\\\;\\\\mathbf{q}_3]$ and check $Q^T Q = I$."},{"prompt":"A $2\\\\times 2$ matrix has columns $(\\\\cos\\\\theta, \\\\sin\\\\theta)$ and $(-\\\\sin\\\\theta, \\\\cos\\\\theta)$. Is it orthogonal, and what is its determinant?","hint":"Check $Q^TQ$ using the identity $\\\\cos^2\\\\theta + \\\\sin^2\\\\theta = 1$.","answer":"Yes, $Q^TQ = I$ because each column is a unit vector and the two columns are perpendicular. $\\\\det(Q) = \\\\cos^2\\\\theta + \\\\sin^2\\\\theta = 1$. It is a rotation matrix by angle $\\\\theta$."}]}
```
