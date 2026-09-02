---
id: vector-spaces.intuition
concept_id: vector-spaces
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
---

A **vector space** $V$ over a field $\mathbb{F}$ (usually $\mathbb{R}$) is a set with vector addition and scalar multiplication satisfying **8 axioms** — grouped for memory into four ideas: closure ($\mathbf{u}+\mathbf{v}\in V$, $c\mathbf{u}\in V$), identity elements (a zero vector; $1\cdot\mathbf{u}=\mathbf{u}$), inverses and commutativity of addition, and distributivity of scalars over sums. Examples beyond $\mathbb{R}^n$: polynomials of degree $\le n$, continuous functions on $[0,1]$, all $m\times n$ matrices.

**Subspaces — the three-test shortcut.** A non-empty $W\subseteq V$ is a subspace iff it passes: contains $\mathbf{0}$, closed under addition, closed under scalar multiplication. Fail the zero-vector test and you're done in one line — the fastest disqualifier.

**Key subspaces of a matrix $A$:** column space $\text{Col}(A)=\{A\mathbf{x}\}$ in $\mathbb{R}^m$, null space $\text{Null}(A)=\{\mathbf{x}:A\mathbf{x}=\mathbf{0}\}$ in $\mathbb{R}^n$, row space in $\mathbb{R}^n$. Rank-Nullity: $\dim(\text{Col}(A))+\dim(\text{Null}(A))=n$.

**Span, basis, dimension.** Span of $S$: all linear combinations of its members. Basis: a linearly independent spanning set. Dimension $\dim(V)$: the number of vectors in any basis — every basis has the same size.

GATE repeatedly tests: verifying whether a subset is a subspace, finding a basis for the null space or column space, and applying rank-nullity. A single counterexample disproves a subspace claim; proving one requires all three tests.

```interactive-spec
{
  "v": 1,
  "kind": "guided_walkthrough",
  "title": "Is W = {x+y+z=0} a subspace of R³?",
  "steps": [
    {
      "prompt": "What are the three conditions to verify W is a subspace of R^3?",
      "hint": "Think about what a subspace must contain and what operations must keep you inside W.",
      "answer": "(1) The zero vector (0,0,0) must be in W. (2) W must be closed under vector addition. (3) W must be closed under scalar multiplication."
    },
    {
      "prompt": "Take u=(x1,y1,z1) and v=(x2,y2,z2) both satisfying x+y+z=0. Show their sum is also in W.",
      "hint": "Add the two constraint equations together.",
      "answer": "(x1+x2)+(y1+y2)+(z1+z2) = (x1+y1+z1)+(x2+y2+z2) = 0+0 = 0. So u+v satisfies the constraint."
    },
    {
      "prompt": "What is a basis for W and what is dim(W)? Use the free-variable method.",
      "hint": "From x+y+z=0, let y=s and z=t be free.",
      "answer": "Basis: {(-1,1,0), (-1,0,1)}. From x = -s-t: (x,y,z) = s(-1,1,0) + t(-1,0,1). dim(W) = 2."
    }
  ]
}
```
