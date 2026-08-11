# Teaching Tips: Linear Transformations

## Common Student Errors
- **Thinking translations are linear**: Translation (adding a constant vector) is NOT linear because $T(\mathbf{0}) \neq \mathbf{0}$. Always check this first.
- **Confusing matrix columns**: Students forget that the columns of the matrix representation are the images of the standard basis vectors. Don't compute $T$ on arbitrary vectors first—use the basis vectors.
- **Mixing up kernel and image dimensions**: Kernel and image are dual concepts via rank-nullity. Forgetting this leads to errors when computing dimensions.

## GATE Question Pattern
GATE linear transformation questions test: (1) verifying linearity; (2) finding matrix representations; (3) computing kernels and images; (4) applying rank-nullity; (5) composing transformations; (6) relating to eigenvalues and diagonalization. Most are MCQ; NAT questions ask for specific basis vectors.

## Speed Tricks for MCQs
- **Zero-vector check**: If $T(0, 0, \ldots, 0) \neq (0, \ldots, 0)$, it's NOT linear—instant answer.
- **Matrix representation shortcut**: Apply $T$ to the standard basis $e_1, e_2, \ldots$ and the results are the matrix columns directly.
- **Rank-nullity instant answer**: Given rank or nullity, instantly compute the other by $\text{rank} + \text{nullity} = n$.

## Must-Memorize Formulas / Results
- **Linearity conditions**: $T(\\mathbf{u} + \\mathbf{v}) = T(\\mathbf{u}) + T(\\mathbf{v})$ and $T(c\\mathbf{v}) = cT(\\mathbf{v})$
- **Zero-vector property**: Linear transformations always map $\\mathbf{0} \\mapsto \\mathbf{0}$
- **Matrix representation**: Columns are images of standard basis vectors
- **Kernel definition**: $\\ker(T) = \\{\\mathbf{v} : T(\\mathbf{v}) = \\mathbf{0}\\}$
- **Image definition**: $\\text{Im}(T) = \\{T(\\mathbf{v}) : \\mathbf{v} \\in V\\}$
- **Rank-nullity theorem**: $\\dim(\\text{Im}(T)) + \\dim(\\ker(T)) = \\dim(\\text{domain})$
- **Injectivity**: $T$ is injective iff $\\ker(T) = \\{\\mathbf{0}\\}$ (iff rank = dim(domain))
- **Surjectivity**: $T$ is surjective iff $\\text{Im}(T) = W$ (full image)
- **Composition**: $(S \\circ T)(\\mathbf{v}) = S(T(\\mathbf{v}))$ → matrix product $BA$ for $T$ then $S$
