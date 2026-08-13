---
id: vector-spaces-intuition
concept_id: vector-spaces
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
---

# Vector Spaces and Subspaces

A **vector space** $V$ over a field $\mathbb{F}$ (usually $\mathbb{R}$) is a set equipped with two operations — vector addition and scalar multiplication — satisfying **8 axioms**. The axioms ensure the space behaves like the familiar $\mathbb{R}^n$: you can add vectors and stretch them, and the results stay in the space.

## The 8 Axioms (grouped for memory)

**Closure (2):** $\mathbf{u}+\mathbf{v}\in V$ and $c\mathbf{u}\in V$ for all $\mathbf{u},\mathbf{v}\in V$, $c\in\mathbb{R}$.

**Identity elements (2):** Zero vector $\mathbf{0}\in V$ with $\mathbf{u}+\mathbf{0}=\mathbf{u}$; scalar $1$ with $1\cdot\mathbf{u}=\mathbf{u}$.

**Inverses and commutativity (2):** $\mathbf{u}+(-\mathbf{u})=\mathbf{0}$; $\mathbf{u}+\mathbf{v}=\mathbf{v}+\mathbf{u}$.

**Distributivity (2):** $c(\mathbf{u}+\mathbf{v})=c\mathbf{u}+c\mathbf{v}$; $(c+d)\mathbf{u}=c\mathbf{u}+d\mathbf{u}$.

Examples beyond $\mathbb{R}^n$: the set of all polynomials of degree $\leq n$, the set of all continuous functions on $[0,1]$, the set of all $m\times n$ matrices.

## Subspaces — The Three-Test Shortcut

A non-empty subset $W \subseteq V$ is a **subspace** if and only if it passes all three tests:

1. **Contains the zero vector:** $\mathbf{0} \in W$
2. **Closed under addition:** $\mathbf{u},\mathbf{v}\in W \Rightarrow \mathbf{u}+\mathbf{v}\in W$
3. **Closed under scalar multiplication:** $\mathbf{u}\in W,\ c\in\mathbb{R} \Rightarrow c\mathbf{u}\in W$

If any test fails, $W$ is not a subspace. Failing Test 1 alone (zero not in $W$) is the fastest disqualifier.

## Key Subspaces of a Matrix $A$

| Subspace | Definition | Lives in |
|---|---|---|
| **Column space** $\text{Col}(A)$ | $\{\,A\mathbf{x} : \mathbf{x}\in\mathbb{R}^n\}$ | $\mathbb{R}^m$ |
| **Null space** $\text{Null}(A)$ | $\{\,\mathbf{x} : A\mathbf{x}=\mathbf{0}\}$ | $\mathbb{R}^n$ |
| **Row space** $\text{Row}(A)$ | span of rows of $A$ | $\mathbb{R}^n$ |

**Rank-Nullity Theorem:** $\dim(\text{Col}(A)) + \dim(\text{Null}(A)) = n$ (number of columns).

## Span, Basis, Dimension

- **Span** of a set $S$: all linear combinations of vectors in $S$.
- **Basis**: a linearly independent spanning set — the minimal set that generates the space.
- **Dimension** $\dim(V)$: the number of vectors in any basis (all bases have the same size).

## GATE Relevance

GATE repeatedly tests: (1) verifying whether a subset is a subspace, (2) finding a basis for the null space / column space, and (3) applying the Rank-Nullity theorem. Subspace proofs require showing all three tests; a single counterexample suffices to disprove.
