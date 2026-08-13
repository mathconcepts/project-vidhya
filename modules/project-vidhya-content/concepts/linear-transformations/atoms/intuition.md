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
```

---

## **FILE 2: visual-analogy.md**
**Path:**
