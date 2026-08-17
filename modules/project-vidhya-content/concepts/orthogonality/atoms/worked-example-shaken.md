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
id: orthogonality.worked-example.shaken
concept_id: orthogonality
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: orthogonality-worked-example
for_stance: shaken
---

## Gram–Schmidt, one vector at a time

**Goal:** turn $\mathbf{v}_1 = (1,1,0)$, $\mathbf{v}_2 = (1,0,1)$, $\mathbf{v}_3 = (0,1,1)$ into three mutually perpendicular vectors of length $1$.

The move, repeated: subtract off the parts already found, then scale to length 1.

---

## Vector 1

$$\|\mathbf{v}_1\| = \sqrt{2}, \qquad \mathbf{q}_1 = \tfrac{1}{\sqrt{2}}(1,1,0)$$

---

## Vector 2

$$\mathbf{v}_2 \cdot \mathbf{q}_1 = \tfrac{1}{\sqrt2}$$

$$\mathbf{u}_2 = (1,0,1) - \tfrac12(1,1,0) = (\tfrac12,-\tfrac12,1), \qquad \mathbf{q}_2 = \tfrac{1}{\sqrt6}(1,-1,2)$$

Check: $\mathbf{q}_1\cdot\mathbf{q}_2 = 0$ ✓ — do this after every vector.

---

## Vector 3

$$\mathbf{u}_3 = (0,1,1) - \tfrac12(1,1,0) - \tfrac16(1,-1,2) = \left(-\tfrac23,\tfrac23,\tfrac23\right)$$

$$\mathbf{q}_3 = \tfrac{1}{\sqrt3}(-1,1,1)$$

---

## The answer

$$\mathbf{q}_1 = \tfrac{1}{\sqrt2}(1,1,0), \quad \mathbf{q}_2 = \tfrac{1}{\sqrt6}(1,-1,2), \quad \mathbf{q}_3 = \tfrac{1}{\sqrt3}(-1,1,1)$$

Every pairwise dot product is $0$; each length is $1$.

Stopping one step early gives orthogonal, not orthonormal — check which the question asked for.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Gram-Schmidt on {(1,1,0),(1,0,1),(0,1,1)}","steps":[{"prompt":"After setting $\\\\mathbf{q}_1 = \\\\frac{1}{\\\\sqrt{2}}(1,1,0)$, what must you subtract from $\\\\mathbf{v}_2 = (1,0,1)$ before normalizing to get $\\\\mathbf{q}_2$?","hint":"Compute the scalar $c = \\\\mathbf{v}_2 \\\\cdot \\\\mathbf{q}_1$, then subtract $c\\\\,\\\\mathbf{q}_1$ from $\\\\mathbf{v}_2$. What is left cannot point along $\\\\mathbf{q}_1$ at all — that is the whole point of subtracting it.","answer":"$c = \\\\frac{1}{\\\\sqrt{2}}$, so subtract $\\\\frac{1}{\\\\sqrt{2}}\\\\cdot\\\\frac{1}{\\\\sqrt{2}}(1,1,0) = \\\\frac{1}{2}(1,1,0)$. This gives $\\\\mathbf{u}_2 = (\\\\frac{1}{2}, -\\\\frac{1}{2}, 1)$."},{"prompt":"How do you verify that two vectors $\\\\mathbf{q}_i$ and $\\\\mathbf{q}_j$ produced by Gram-Schmidt are truly orthonormal?","hint":"Check both conditions: zero dot product (orthogonal) and unit length (normal). Do this after every vector — catching an error here costs one step; catching it at the end costs all three.","answer":"Compute $\\\\mathbf{q}_i \\\\cdot \\\\mathbf{q}_j$: must equal 0 for $i \\\\neq j$ and 1 for $i = j$. Equivalently, form the matrix $Q = [\\\\mathbf{q}_1\\\\;\\\\mathbf{q}_2\\\\;\\\\mathbf{q}_3]$ and check $Q^T Q = I$."},{"prompt":"For $\\\\mathbf{q}_3$, confirm the length-1 condition: does $\\\\frac{1}{3}(1+1+1)$ equal 1?","hint":"$\\\\mathbf{q}_3 = \\\\frac{1}{\\\\sqrt3}(-1,1,1)$, so $\\\\|\\\\mathbf{q}_3\\\\|^2$ is the sum of the squared components divided by 3.","answer":"Yes: $\\\\frac{1}{3}(1+1+1) = 1$, so $\\\\|\\\\mathbf{q}_3\\\\| = 1$."},{"prompt":"A $2\\\\times 2$ matrix has columns $(\\\\cos\\\\theta, \\\\sin\\\\theta)$ and $(-\\\\sin\\\\theta, \\\\cos\\\\theta)$. Is it orthogonal, and what is its determinant?","hint":"Check $Q^TQ$ using the identity $\\\\cos^2\\\\theta + \\\\sin^2\\\\theta = 1$.","answer":"Yes, $Q^TQ = I$ because each column is a unit vector and the two columns are perpendicular. $\\\\det(Q) = \\\\cos^2\\\\theta + \\\\sin^2\\\\theta = 1$. It is a rotation matrix by angle $\\\\theta$."}]}
```
