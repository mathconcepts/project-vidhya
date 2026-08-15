---
id: orthogonality-intuition
concept_id: orthogonality
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
---

# What Is Orthogonality?

Two vectors $\mathbf{u}$ and $\mathbf{v}$ in $\mathbb{R}^n$ are **orthogonal** when their dot product is zero:

$$\mathbf{u} \cdot \mathbf{v} = \sum_{i=1}^n u_i v_i = 0$$

Zero dot product means the angle between them is exactly $90°$. They point in **completely independent directions** — knowing a vector's component along $\mathbf{u}$ tells you nothing about its component along $\mathbf{v}$.

## Orthonormal Vectors

A set $\{\mathbf{q}_1, \mathbf{q}_2, \ldots, \mathbf{q}_n\}$ is **orthonormal** when:

$$\mathbf{q}_i \cdot \mathbf{q}_j = \delta_{ij} = \begin{cases} 1 & i = j \\ 0 & i \neq j \end{cases}$$

Orthonormal = orthogonal + unit length. The standard basis $\{\mathbf{e}_1, \mathbf{e}_2, \mathbf{e}_3\}$ is the simplest example.

## Gram-Schmidt Process

Given any linearly independent set $\{\mathbf{v}_1, \mathbf{v}_2, \ldots\}$, **Gram-Schmidt** produces an orthonormal set spanning the same space:

$$\mathbf{u}_1 = \mathbf{v}_1, \qquad \mathbf{q}_1 = \frac{\mathbf{u}_1}{\|\mathbf{u}_1\|}$$

$$\mathbf{u}_2 = \mathbf{v}_2 - (\mathbf{v}_2 \cdot \mathbf{q}_1)\mathbf{q}_1, \qquad \mathbf{q}_2 = \frac{\mathbf{u}_2}{\|\mathbf{u}_2\|}$$

Each step **subtracts the projection** onto all previous orthonormal vectors, leaving only the component perpendicular to all of them.

## Orthogonal Matrices

A square matrix $Q$ is **orthogonal** when its columns are orthonormal:

$$Q^T Q = I \implies Q^{-1} = Q^T$$

Key properties of orthogonal matrices:
- $\det(Q) = \pm 1$
- They preserve length: $\|Q\mathbf{x}\| = \|\mathbf{x}\|$
- They preserve angles: $(Q\mathbf{u}) \cdot (Q\mathbf{v}) = \mathbf{u} \cdot \mathbf{v}$
- Geometrically: rotations ($\det = +1$) or reflections ($\det = -1$)

## Orthogonal Complement

The **orthogonal complement** $W^\perp$ of a subspace $W$ is the set of all vectors perpendicular to every vector in $W$:

$$W^\perp = \{\mathbf{v} : \mathbf{v} \cdot \mathbf{w} = 0 \text{ for all } \mathbf{w} \in W\}$$

Fundamental theorem: $\mathbb{R}^n = W \oplus W^\perp$ (every vector has a unique decomposition).

## QR Decomposition

Gram-Schmidt gives the **QR factorization**: $A = QR$ where $Q$ has orthonormal columns and $R$ is upper triangular. Used to solve least-squares problems and in numerical algorithms.

## GATE Quick Checks

| Property | Test |
|---|---|
| Vectors orthogonal? | Compute dot product; equals 0? |
| Matrix orthogonal? | Check $Q^T Q = I$ (or equivalently $QQ^T = I$) |
| Orthonormal set? | Dot products: 0 for distinct pairs, 1 for self |
| Apply Gram-Schmidt | Project and subtract, then normalize |

---

```interactive-spec
{
  "v": 1,
  "kind": "manipulable",
  "title": "Drag u and v until the dot product hits zero — that's perpendicular",
  "inputs": [
    {"id": "u1", "label": "u1", "min": -3, "max": 3, "step": 0.5, "initial": 3},
    {"id": "u2", "label": "u2", "min": -3, "max": 3, "step": 0.5, "initial": 1},
    {"id": "v1", "label": "v1", "min": -3, "max": 3, "step": 0.5, "initial": 1},
    {"id": "v2", "label": "v2", "min": -3, "max": 3, "step": 0.5, "initial": 2}
  ],
  "outputs": [
    {"label": "u · v = u1v1 + u2v2", "formula": "u1*v1 + u2*v2", "digits": 2},
    {"label": "|u|", "formula": "sqrt(u1^2 + u2^2)", "digits": 2},
    {"label": "|v|", "formula": "sqrt(v1^2 + v2^2)", "digits": 2}
  ],
  "caption": "Try to make u · v = 0 by dragging — the instant it hits zero, u and v are exactly perpendicular, whatever their lengths."
}
```
