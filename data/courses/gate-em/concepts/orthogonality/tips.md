# Teaching Tips: Orthogonality

## Common Student Errors
- **Confusing orthogonal vectors with linearly independent vectors**: Orthogonal vectors are linearly independent, but the converse is not true. Orthogonality is a stricter condition.
- **Forgetting to normalize after orthogonalizing**: Gram-Schmidt produces orthogonal vectors, not orthonormal ones—you must divide by the norm to normalize. Students often forget this final step.
- **Thinking orthogonal matrices preserve direction**: Orthogonal matrices preserve lengths and angles, but may rotate or reflect vectors. They don't preserve the direction of arbitrary vectors (only lengths and relative angles).

## GATE Question Pattern
GATE orthogonality questions test: (1) computing dot products and checking orthogonality; (2) Gram-Schmidt orthogonalization (often 2–3 vectors); (3) properties of orthogonal matrices ($Q^T Q = I$, $\det(Q) = \pm 1$, eigenvalues on the unit circle); (4) orthogonal projections; (5) orthogonal complements. Most are MCQ identifying orthogonal sets or computing orthonormal bases; NAT questions ask for specific vector components.

## Speed Tricks for MCQs
- **Dot product shortcut**: Two vectors are orthogonal iff their dot product is zero. If you spot this quickly, the answer is immediate.
- **Orthogonal matrix recognition**: If a matrix has orthonormal columns, it's orthogonal. Columns are orthonormal iff each is a unit vector and pairwise dot products are zero. Spot this visually first (e.g., sines and cosines suggest a rotation matrix).
- **Gram-Schmidt efficiency**: Don't compute all projections explicitly—use the formula $\mathbf{v}_i' = \mathbf{v}_i - \sum_{j < i} (\mathbf{v}_i \cdot \mathbf{e}_j) \mathbf{e}_j$ where $\mathbf{e}_j$ are already normalized.

## Must-Memorize Formulas / Results
- **Orthogonality condition**: $\\mathbf{u} \\cdot \\mathbf{v} = 0$
- **Orthogonal matrix property**: $Q^T Q = QQ^T = I$ (equivalently, $Q^{-1} = Q^T$)
- **Determinant of orthogonal matrix**: $\\det(Q) = \\pm 1$
- **Gram-Schmidt formula**: $\\mathbf{v}_i' = \\mathbf{v}_i - \\sum_{j < i} (\\mathbf{v}_i \\cdot \\mathbf{e}_j) \\mathbf{e}_j$, then $\\mathbf{e}_i = \\mathbf{v}_i' / \\|\\mathbf{v}_i'\\|$
- **Orthogonal complement**: $W^\\perp = \\{\\mathbf{v} : \\mathbf{v} \\cdot \\mathbf{w} = 0 \\text{ for all } \\mathbf{w} \\in W\\}$
- **Projection onto orthonormal basis**: $\\text{proj}_W(\\mathbf{v}) = \\sum_i (\\mathbf{v} \\cdot \\mathbf{e}_i) \\mathbf{e}_i$ (easy if basis is orthonormal)
- **Orthogonal matrix eigenvalues**: Eigenvalues lie on the unit circle (magnitude 1)
- **Symmetric matrix diagonalization**: Eigenvectors of a symmetric matrix are mutually orthogonal
