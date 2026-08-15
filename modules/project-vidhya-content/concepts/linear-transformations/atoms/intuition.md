---
id: linear-transformations.intuition
concept_id: linear-transformations
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
---

# Linear Transformations: Building Intuition

A **linear transformation** is a function $T: V \to W$ between vector spaces that preserves two key properties: addition and scalar multiplication. If $T(\vec{u} + \vec{v}) = T(\vec{u}) + T(\vec{v})$ and $T(c\vec{u}) = c \cdot T(\vec{u})$ for all vectors and scalars, then $T$ is linear.

## Why This Matters

Linear transformations are the bridge between abstract algebra and geometry. They let us:
- **Map vectors predictably**: rotation, reflection, scaling all preserve vector structure
- **Represent transformations as matrices**: any linear $T: \mathbb{R}^n \to \mathbb{R}^m$ becomes an $m \times n$ matrix
- **Solve systems efficiently**: linear algebra machinery applies

## Key Concepts

**Kernel (Null Space):** The set of all vectors that map to zero: $\text{Ker}(T) = \{\vec{v} : T(\vec{v}) = \vec{0}\}$. Think of it as "what disappears under the transformation." For a GATE exam, finding the kernel means solving $T(\vec{v}) = \vec{0}$.

**Image (Range):** The set of all possible outputs: $\text{Im}(T) = \{T(\vec{v}) : \vec{v} \in V\}$. This is "everything the transformation can reach."

**Rank-Nullity Theorem:** For finite-dimensional spaces, $\dim(V) = \text{rank}(T) + \text{nullity}(T)$, where rank is the dimension of the image and nullity is the dimension of the kernel. This is your reality check on any calculation.

**Matrix Representation:** Once you pick bases, every linear transformation becomes a concrete matrix that you can multiply with.

```interactive-spec
{
  "v": 1,
  "kind": "manipulable",
  "title": "Drag the entries of A = [[2,-1],[1,1]] and watch the basis vectors move",
  "inputs": [
    {"id": "a", "label": "a (row 1, col 1)", "min": -3, "max": 3, "step": 0.5, "initial": 2},
    {"id": "b", "label": "b (row 1, col 2)", "min": -3, "max": 3, "step": 0.5, "initial": -1},
    {"id": "c", "label": "c (row 2, col 1)", "min": -3, "max": 3, "step": 0.5, "initial": 1},
    {"id": "d", "label": "d (row 2, col 2)", "min": -3, "max": 3, "step": 0.5, "initial": 1}
  ],
  "outputs": [
    {"label": "T(e1) x-coordinate", "formula": "a", "digits": 2},
    {"label": "T(e1) y-coordinate", "formula": "c", "digits": 2},
    {"label": "T(e2) x-coordinate", "formula": "b", "digits": 2},
    {"label": "T(e2) y-coordinate", "formula": "d", "digits": 2},
    {"label": "trace = a + d", "formula": "a + d", "digits": 2},
    {"label": "det = ad - bc", "formula": "a*d - b*c", "digits": 2}
  ],
  "caption": "e1 = (1,0) and e2 = (0,1) are the standard basis vectors. Drag any entry and watch its column move — that column IS where the transform sends that basis vector."
}
```
