# Teaching Tips: Vector Spaces

## Common Student Errors
- **Confusing subspace conditions**: Students forget that a subspace MUST contain the zero vector and must be closed under both addition AND scalar multiplication. Missing any one condition disqualifies it.
- **Assuming non-zero implies subspace**: A set like $\{(x, y) : x + y = 1\}$ contains non-zero vectors but is NOT a subspace because it doesn't contain $(0, 0)$.
- **Counting basis vectors incorrectly**: Students sometimes think the dimension equals the number of non-zero components in vectors, rather than the cardinality of a minimal spanning set.

## GATE Question Pattern
GATE vector space questions test: (1) verifying subspace properties (especially checking closure); (2) finding dimensions and bases; (3) linear independence/dependence; (4) null space and column space dimensions. Most are MCQ identifying subspaces or computing dimensions.

## Speed Tricks for MCQs
- **Zero vector check**: Always first check if $(0, 0, \ldots, 0)$ is in the proposed set. If not, it's not a subspace—instant elimination.
- **Dimension formula**: For $\mathbb{R}^{m \times n}$ (the space of all $m \times n$ matrices), $\dim = mn$ instantly. For polynomial spaces of degree $\leq n$, $\dim = n + 1$ (constant term counts as one dimension).
- **Linearly dependent vectors**: If one vector is a scalar multiple of another, they're dependent. Spot this visually first before computing determinants.

## Must-Memorize Formulas / Results
- **Subspace axioms**: Closure under addition, closure under scalar multiplication, contains $\mathbf{0}$
- **Dimension of $\\mathbb{R}^{m \\times n}$**: $\\dim = mn$
- **Dimension of polynomials degree $\\leq n$**: $\\dim = n + 1$
- **Rank-nullity**: $\\dim(\\text{col}(A)) + \\dim(\\text{null}(A)) = n$
- **Basis properties**: Basis must be linearly independent and span the space
- **Dimension theorem**: Any two bases have the same cardinality (dimension is well-defined)
- **Proper subspace bounds**: If $W \\subset V$ (proper), then $\\dim(W) < \\dim(V)$
