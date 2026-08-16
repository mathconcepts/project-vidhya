---
# Alternative body for orthogonality-worked-example, served when the learner stance is
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
id: orthogonality-worked-example.shaken
concept_id: orthogonality
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: orthogonality-worked-example
for_stance: shaken
---

# Gram–Schmidt, one vector at a time

**Goal:** turn $\mathbf{v}_1 = (1,1,0)$, $\mathbf{v}_2 = (1,0,1)$, $\mathbf{v}_3 = (0,1,1)$ into three vectors that are mutually perpendicular and each of length $1$.

The whole method is one move, repeated: **take the next vector, subtract off the parts that point along the ones you already have, then scale what is left to length 1.**

---

## Vector 1 — nothing to subtract

There is nothing before it, so just scale it to length $1$.

$$\|\mathbf{v}_1\| = \sqrt{1^2 + 1^2 + 0^2} = \sqrt{2}$$

$$\mathbf{q}_1 = \frac{1}{\sqrt{2}}(1,1,0)$$

---

## Vector 2 — subtract the part along $\mathbf{q}_1$

**How much of $\mathbf{v}_2$ points along $\mathbf{q}_1$?** That is what the dot product measures:

$$\mathbf{v}_2 \cdot \mathbf{q}_1 = (1)\tfrac{1}{\sqrt2} + (0)\tfrac{1}{\sqrt2} + (1)(0) = \tfrac{1}{\sqrt2}$$

**Subtract that much of $\mathbf{q}_1$ away:**

$$\mathbf{u}_2 = (1,0,1) - \tfrac{1}{\sqrt2}\cdot\tfrac{1}{\sqrt2}(1,1,0) = (1,0,1) - (\tfrac12,\tfrac12,0) = (\tfrac12,-\tfrac12,1)$$

What is left cannot point along $\mathbf{q}_1$ at all — that is exactly what we removed.

**Scale to length 1:**

$$\|\mathbf{u}_2\| = \sqrt{\tfrac14+\tfrac14+1} = \sqrt{\tfrac32}, \qquad \mathbf{q}_2 = \tfrac{1}{\sqrt6}(1,-1,2)$$

**Check before moving on:** $\mathbf{q}_1\cdot\mathbf{q}_2 = \tfrac{1}{\sqrt{12}} - \tfrac{1}{\sqrt{12}} + 0 = 0$ ✓

Do this check after every vector. Catching an error here costs one step; catching it at the end costs all three.

---

## Vector 3 — subtract two parts this time

Same move, now against both finished vectors.

$$\mathbf{v}_3\cdot\mathbf{q}_1 = \tfrac{1}{\sqrt2}, \qquad \mathbf{v}_3\cdot\mathbf{q}_2 = \tfrac{1}{\sqrt6}$$

$$\mathbf{u}_3 = (0,1,1) - \tfrac12(1,1,0) - \tfrac16(1,-1,2) = \left(-\tfrac23, \tfrac23, \tfrac23\right)$$

$$\|\mathbf{u}_3\| = \tfrac{2}{\sqrt3}, \qquad \mathbf{q}_3 = \tfrac{1}{\sqrt3}(-1,1,1)$$

---

## The answer

$$\mathbf{q}_1 = \tfrac{1}{\sqrt2}(1,1,0), \qquad \mathbf{q}_2 = \tfrac{1}{\sqrt6}(1,-1,2), \qquad \mathbf{q}_3 = \tfrac{1}{\sqrt3}(-1,1,1)$$

**Two things to verify:** every pairwise dot product is $0$, and each length is $1$. For $\mathbf{q}_3$: $\tfrac13(1+1+1) = 1$ ✓

---

**The most common lost mark** is stopping one step early — producing perpendicular vectors but forgetting to divide by the length. Perpendicular is *orthogonal*; perpendicular **and** length $1$ is *orthonormal*. Read which one the question asked for.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Gram-Schmidt on {(1,1,0),(1,0,1),(0,1,1)}","steps":[{"prompt":"After setting $\\\\mathbf{q}_1 = \\\\frac{1}{\\\\sqrt{2}}(1,1,0)$, what must you subtract from $\\\\mathbf{v}_2 = (1,0,1)$ before normalizing to get $\\\\mathbf{q}_2$?","hint":"Compute the scalar $c = \\\\mathbf{v}_2 \\\\cdot \\\\mathbf{q}_1$, then subtract $c\\\\,\\\\mathbf{q}_1$ from $\\\\mathbf{v}_2$.","answer":"$c = \\\\frac{1}{\\\\sqrt{2}}$, so subtract $\\\\frac{1}{\\\\sqrt{2}}\\\\cdot\\\\frac{1}{\\\\sqrt{2}}(1,1,0) = \\\\frac{1}{2}(1,1,0)$. This gives $\\\\mathbf{u}_2 = (\\\\frac{1}{2}, -\\\\frac{1}{2}, 1)$."},{"prompt":"How do you verify that two vectors $\\\\mathbf{q}_i$ and $\\\\mathbf{q}_j$ produced by Gram-Schmidt are truly orthonormal?","hint":"Check both conditions: zero dot product (orthogonal) and unit length (normal).","answer":"Compute $\\\\mathbf{q}_i \\\\cdot \\\\mathbf{q}_j$: must equal 0 for $i \\\\neq j$ and 1 for $i = j$. Equivalently, form the matrix $Q = [\\\\mathbf{q}_1\\\\;\\\\mathbf{q}_2\\\\;\\\\mathbf{q}_3]$ and check $Q^T Q = I$."},{"prompt":"A $2\\\\times 2$ matrix has columns $(\\\\cos\\\\theta, \\\\sin\\\\theta)$ and $(-\\\\sin\\\\theta, \\\\cos\\\\theta)$. Is it orthogonal, and what is its determinant?","hint":"Check $Q^TQ$ using the identity $\\\\cos^2\\\\theta + \\\\sin^2\\\\theta = 1$.","answer":"Yes, $Q^TQ = I$ because each column is a unit vector and the two columns are perpendicular. $\\\\det(Q) = \\\\cos^2\\\\theta + \\\\sin^2\\\\theta = 1$. It is a rotation matrix by angle $\\\\theta$."}]}
```
