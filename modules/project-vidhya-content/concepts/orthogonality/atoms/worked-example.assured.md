---
# Alternative body for orthogonality-worked-example, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
#
# The fenced interactive block below is copied verbatim from the base
# atom so the widget cannot drift between variants; only prose differs.
id: orthogonality-worked-example.assured
concept_id: orthogonality
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: orthogonality-worked-example
for_stance: assured
---

# Gram–Schmidt on $\{(1,1,0),(1,0,1),(0,1,1)\}$

$$\mathbf{q}_1 = \tfrac{1}{\sqrt2}(1,1,0), \qquad \mathbf{q}_2 = \tfrac{1}{\sqrt6}(1,-1,2), \qquad \mathbf{q}_3 = \tfrac{1}{\sqrt3}(-1,1,1)$$

The mechanics are $\mathbf{u}_k = \mathbf{v}_k - \sum_{j<k}\langle \mathbf{v}_k,\mathbf{q}_j\rangle \mathbf{q}_j$, then normalise. You know that. What follows is what makes it faster and what makes it wrong.

---

## Work in unnormalised form, normalise once

Carrying $\sqrt2$, $\sqrt6$, $\sqrt3$ through every projection is where the arithmetic errors come from. Use $\mathbf{u}_k = \mathbf{v}_k - \sum_{j<k}\frac{\langle \mathbf{v}_k,\mathbf{u}_j\rangle}{\langle \mathbf{u}_j,\mathbf{u}_j\rangle}\mathbf{u}_j$ with plain integer vectors, then normalise all three at the end.

Here: $\mathbf{u}_1 = (1,1,0)$, $\mathbf{u}_2 = (1,0,1) - \tfrac12(1,1,0) = \tfrac12(1,-1,2)$, and $\mathbf{u}_3 \parallel (-1,1,1)$. Scale each to length $1$ in one pass. Fractions never appear inside a projection.

---

## Two free checks

**Cross-product shortcut in $\mathbb{R}^3$.** Once you have $\mathbf{q}_1,\mathbf{q}_2$, the third is $\pm \mathbf{q}_1\times\mathbf{q}_2$ — no projection needed. $\tfrac{1}{\sqrt2}(1,1,0)\times\tfrac{1}{\sqrt6}(1,-1,2) = \tfrac{1}{\sqrt{12}}(2,-2,-2) \parallel (-1,1,1)$ up to sign. ✓ Use it as a check, or to skip step 3 outright.

**Determinant check.** The matrix $Q = [\mathbf{q}_1\ \mathbf{q}_2\ \mathbf{q}_3]$ must satisfy $|\det Q| = 1$, since orthonormal columns make it orthogonal. One determinant validates all three vectors at once.

---

## Where the marks go

- **Stopping at orthogonal.** Gram–Schmidt without the normalisation answers a different question. Check which was asked.
- **Sign of $\mathbf{q}_3$.** Not determined by orthonormality — both signs are correct bases. Only an orientation constraint ($\det Q = +1$) fixes it, so do not defend a particular sign unless one was imposed.
- **Order dependence.** Permuting the inputs gives a different orthonormal basis, all equally valid.
- **Near-dependent inputs.** Classical Gram–Schmidt loses orthogonality numerically; modified Gram–Schmidt or Householder is the real-world answer. Occasionally asked as theory.

$Q^{\mathsf T}Q = I$ also gives you $Q^{-1} = Q^{\mathsf T}$ free, which is the point of building the basis in the first place.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Gram-Schmidt on {(1,1,0),(1,0,1),(0,1,1)}","steps":[{"prompt":"After setting $\\\\mathbf{q}_1 = \\\\frac{1}{\\\\sqrt{2}}(1,1,0)$, what must you subtract from $\\\\mathbf{v}_2 = (1,0,1)$ before normalizing to get $\\\\mathbf{q}_2$?","hint":"Compute the scalar $c = \\\\mathbf{v}_2 \\\\cdot \\\\mathbf{q}_1$, then subtract $c\\\\,\\\\mathbf{q}_1$ from $\\\\mathbf{v}_2$.","answer":"$c = \\\\frac{1}{\\\\sqrt{2}}$, so subtract $\\\\frac{1}{\\\\sqrt{2}}\\\\cdot\\\\frac{1}{\\\\sqrt{2}}(1,1,0) = \\\\frac{1}{2}(1,1,0)$. This gives $\\\\mathbf{u}_2 = (\\\\frac{1}{2}, -\\\\frac{1}{2}, 1)$."},{"prompt":"How do you verify that two vectors $\\\\mathbf{q}_i$ and $\\\\mathbf{q}_j$ produced by Gram-Schmidt are truly orthonormal?","hint":"Check both conditions: zero dot product (orthogonal) and unit length (normal).","answer":"Compute $\\\\mathbf{q}_i \\\\cdot \\\\mathbf{q}_j$: must equal 0 for $i \\\\neq j$ and 1 for $i = j$. Equivalently, form the matrix $Q = [\\\\mathbf{q}_1\\\\;\\\\mathbf{q}_2\\\\;\\\\mathbf{q}_3]$ and check $Q^T Q = I$."},{"prompt":"A $2\\\\times 2$ matrix has columns $(\\\\cos\\\\theta, \\\\sin\\\\theta)$ and $(-\\\\sin\\\\theta, \\\\cos\\\\theta)$. Is it orthogonal, and what is its determinant?","hint":"Check $Q^TQ$ using the identity $\\\\cos^2\\\\theta + \\\\sin^2\\\\theta = 1$.","answer":"Yes, $Q^TQ = I$ because each column is a unit vector and the two columns are perpendicular. $\\\\det(Q) = \\\\cos^2\\\\theta + \\\\sin^2\\\\theta = 1$. It is a rotation matrix by angle $\\\\theta$."}]}
```
